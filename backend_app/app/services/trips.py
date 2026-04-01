from sqlalchemy import delete, select, update
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional
from datetime import datetime
import logging
from app.models.trip import Trip
from app.models.step import Step
from app.schemas.trip import TripCreate, TripRead, TripUpdate
from app.schemas.trip import TripWithSteps
from app.schemas.step import StepRead
from app.utils.distance import calculate_total_distance
from app.utils.errors import NotFoundError, ForbiddenError, check_ownership

logger = logging.getLogger(__name__)


def _route_geojson(steps: List[Step]) -> Optional[dict]:
    """Convert steps to GeoJSON LineString."""
    if len(steps) < 2:
        return None
    coords = [[s.lng, s.lat] for s in steps]
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "LineString", "coordinates": coords},
                "properties": {"step_count": len(coords)},
            }
        ],
    }


async def create_trip(user_id: UUID, payload: TripCreate, session: AsyncSession) -> Trip:
    trip = Trip(user_id=user_id, **payload.model_dump())
    session.add(trip)
    await session.commit()
    await session.refresh(trip)
    return trip


async def get_user_trips(user_id: UUID, session: AsyncSession, skip: int = 0, limit: int = 100) -> List[Trip]:
    """Get all trips for a user with enriched distance and step count."""
    user_id_str = str(user_id)
    result = await session.execute(
        select(Trip).where(Trip.user_id == user_id_str).order_by(Trip.created_at.desc()).offset(skip).limit(limit)
    )
    trips = result.scalars().all()
    
    # Enrich each trip with distance and step count
    for trip in trips:
        steps_result = await session.execute(
            select(Step).where(Step.trip_id == trip.id).order_by(Step.timestamp.asc())
        )
        steps = steps_result.scalars().all()
        trip.total_distance = calculate_total_distance(steps)
        trip.total_steps = len(steps)
    
    return trips


async def get_trip_with_steps(trip_id: UUID, session: AsyncSession) -> TripWithSteps:
    """Get a trip with all its steps and geojson route."""
    # Convert UUID to string for database lookup since Trip.id is VARCHAR(36)
    trip_id_str = str(trip_id)
    trip = await session.get(Trip, trip_id_str)
    if not trip:
        return None
    
    # Load steps ordered by timestamp, eager-load images
    result = await session.execute(
        select(Step).where(Step.trip_id == trip_id_str).options(selectinload(Step.images)).order_by(Step.timestamp.asc())
    )
    steps = result.scalars().all()
    trip.total_distance = calculate_total_distance(steps)
    trip.total_steps = len(steps)
    
    # Convert all data safely without triggering lazy loading
    step_reads = [StepRead.model_validate(s) for s in steps]
    geojson = _route_geojson(steps) if len(steps) >= 2 else None
    
    # Build TripWithSteps by directly passing all fields
    return TripWithSteps(
        id=trip.id,
        user_id=trip.user_id,
        title=trip.title,
        description=trip.description,
        start_date=trip.start_date,
        end_date=trip.end_date,
        is_public=trip.is_public,
        created_at=trip.created_at,
        updated_at=trip.updated_at,
        total_distance=trip.total_distance,
        total_steps=trip.total_steps,
        steps=step_reads,
        route_geojson=geojson,
    )


async def update_trip(trip_id: UUID, user_id: UUID, payload: TripUpdate, session: AsyncSession) -> Trip:
    trip_id_str = str(trip_id)
    user_id_str = str(user_id)
    result = await session.execute(select(Trip).where(Trip.id == trip_id_str))
    trip = result.scalar_one_or_none()
    if not trip:
        raise NotFoundError("Trip")
    check_ownership(trip.user_id, user_id_str, "Trip")
    update_data = payload.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(trip, key, value)
    trip.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(trip)
    return trip


async def delete_trip(trip_id: UUID, session: AsyncSession, current_user) -> dict:
    """Delete a trip and all associated steps."""
    try:
        # Convert UUID to string for database lookup
        trip_id_str = str(trip_id)
        user_id_str = str(current_user.id)
        
        logger.info(f"Deleting trip {trip_id_str} by user {user_id_str}")
        
        # Verify trip exists
        result = await session.execute(select(Trip).where(Trip.id == trip_id_str))
        trip = result.scalar_one_or_none()
        
        if not trip:
            logger.warning(f"Trip {trip_id_str} not found")
            raise NotFoundError("Trip")
        
        # Verify ownership
        check_ownership(trip.user_id, user_id_str, "Trip")
        
        logger.info(f"Deleting {trip_id_str} and all associated steps")
        
        # Delete associated steps
        steps_delete = await session.execute(delete(Step).where(Step.trip_id == trip_id_str))
        steps_deleted = steps_delete.rowcount
        logger.info(f"Deleted {steps_deleted} steps")
        
        # Delete the trip
        trip_delete = await session.execute(delete(Trip).where(Trip.id == trip_id_str))
        await session.flush()
        await session.commit()
        
        logger.info(f"✅ Trip {trip_id_str} and {steps_deleted} steps deleted successfully")
        
        return {"message": "Trip deleted successfully", "trip_id": str(trip_id), "steps_deleted": steps_deleted}
    except Exception as e:
        logger.error(f"Exception during deletion: {str(e)}")
        await session.rollback()
        raise


async def split_trip(
    trip_id: UUID,
    user_id: UUID,
    new_title: str,
    step_ids: List[str],
    session: AsyncSession,
):
    """Split a trip by moving specified steps into a new trip."""
    trip_id_str = str(trip_id)
    user_id_str = str(user_id)

    result = await session.execute(select(Trip).where(Trip.id == trip_id_str))
    original_trip = result.scalar_one_or_none()
    if not original_trip:
        raise NotFoundError("Trip")
    check_ownership(original_trip.user_id, user_id_str, "Trip")

    if not step_ids:
        raise ValueError("No steps provided to split")

    # Verify all step_ids belong to this trip
    steps_result = await session.execute(
        select(Step).where(Step.id.in_(step_ids), Step.trip_id == trip_id_str)
    )
    steps_to_move = steps_result.scalars().all()
    if len(steps_to_move) != len(step_ids):
        raise ValueError("Some steps do not belong to this trip")

    # Determine start_date for new trip from earliest step timestamp
    earliest_ts = min(s.timestamp for s in steps_to_move)
    new_start_date = earliest_ts.date() if earliest_ts else None

    # Create the new trip
    new_trip = Trip(
        user_id=user_id_str,
        title=new_title,
        start_date=new_start_date,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(new_trip)
    await session.flush()  # get new_trip.id

    # Move steps to new trip
    await session.execute(
        update(Step)
        .where(Step.id.in_(step_ids))
        .values(trip_id=new_trip.id)
    )

    await session.commit()
    await session.refresh(new_trip)
    await session.refresh(original_trip)

    # Recalculate distances
    orig_steps_result = await session.execute(
        select(Step).where(Step.trip_id == trip_id_str).order_by(Step.timestamp.asc())
    )
    orig_steps = orig_steps_result.scalars().all()
    original_trip.total_distance = calculate_total_distance(orig_steps)
    original_trip.total_steps = len(orig_steps)

    new_steps_result = await session.execute(
        select(Step).where(Step.trip_id == new_trip.id).order_by(Step.timestamp.asc())
    )
    new_steps = new_steps_result.scalars().all()
    new_trip.total_distance = calculate_total_distance(new_steps)
    new_trip.total_steps = len(new_steps)

    return original_trip, new_trip

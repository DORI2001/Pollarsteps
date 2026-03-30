from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional
import logging
from app.models.trip import Trip
from app.models.step import Step
from app.schemas.trip import TripCreate
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


async def get_user_trips(user_id: UUID, session: AsyncSession) -> List[Trip]:
    """Get all trips for a user with enriched distance and step count."""
    user_id_str = str(user_id)
    result = await session.execute(
        select(Trip).where(Trip.user_id == user_id_str).order_by(Trip.created_at.desc())
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
    
    # Load steps ordered by timestamp
    result = await session.execute(
        select(Step).where(Step.trip_id == trip_id_str).order_by(Step.timestamp.asc())
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

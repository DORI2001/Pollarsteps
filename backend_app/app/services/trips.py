from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional
from app.models.trip import Trip
from app.models.step import Step
from app.schemas.trip import TripCreate
from app.schemas.trip import TripWithSteps
from app.schemas.step import StepRead
import math


def _calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two coordinates using Haversine formula (km)"""
    R = 6371  # Earth radius in km
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def _route_geojson(steps: List[Step]) -> Optional[dict]:
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


def _calculate_trip_distance(steps: List[Step]) -> float:
    """Calculate total distance of a trip from steps"""
    if len(steps) < 2:
        return 0.0
    
    total = 0.0
    for i in range(len(steps) - 1):
        total += _calculate_distance(steps[i].lat, steps[i].lng, steps[i+1].lat, steps[i+1].lng)
    return round(total, 2)


async def create_trip(user_id: UUID, payload: TripCreate, session: AsyncSession) -> Trip:
    trip = Trip(user_id=user_id, **payload.model_dump())
    session.add(trip)
    await session.commit()
    await session.refresh(trip)
    return trip


async def get_user_trips(user_id: UUID, session: AsyncSession) -> List[Trip]:
    user_id_str = str(user_id)
    result = await session.execute(select(Trip).where(Trip.user_id == user_id_str).order_by(Trip.created_at.desc()))
    trips = result.scalars().all()
    
    # Enrich each trip with distance and step count
    for trip in trips:
        steps_result = await session.execute(select(Step).where(Step.trip_id == trip.id).order_by(Step.timestamp.asc()))
        steps = steps_result.scalars().all()
        trip.total_distance = _calculate_trip_distance(steps)
        trip.total_steps = len(steps)
    
    return trips


async def get_trip_with_steps(trip_id: UUID, session: AsyncSession) -> TripWithSteps:
    # Convert UUID to string for database lookup since Trip.id is VARCHAR(36)
    trip_id_str = str(trip_id)
    trip = await session.get(Trip, trip_id_str)
    if not trip:
        return None
    # eager load steps ordered
    result = await session.execute(select(Step).where(Step.trip_id == trip_id_str).order_by(Step.timestamp.asc()))
    steps = result.scalars().all()
    trip.total_distance = _calculate_trip_distance(steps)
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
    try:
        # Convert UUID to string for database lookup
        trip_id_str = str(trip_id)
        user_id_str = str(current_user.id)
        
        print(f"[DELETE] Starting deletion of trip {trip_id_str} by user {user_id_str}")
        
        # Use select statement to fetch trip to verify ownership
        result = await session.execute(select(Trip).where(Trip.id == trip_id_str))
        trip = result.scalar_one_or_none()
        
        if not trip:
            print(f"[DELETE] Trip {trip_id_str} not found in database")
            return None
        
        print(f"[DELETE] Found trip '{trip.title}'. Trip user_id={trip.user_id}, Current user_id={user_id_str}")
        
        # Verify ownership
        if trip.user_id != user_id_str:
            print(f"[DELETE] Permission denied: trip belongs to {trip.user_id}, not {user_id_str}")
            return None
        
        print(f"[DELETE] Permission check passed. Deleting trip {trip_id_str} and its steps...")
        
        # Delete associated steps first using imperative delete
        print(f"[DELETE] Executing DELETE for steps...")
        steps_delete = await session.execute(delete(Step).where(Step.trip_id == trip_id_str))
        steps_deleted = steps_delete.rowcount
        print(f"[DELETE] Deleted {steps_deleted} steps")
        
        # Delete the trip using imperative delete instead of session.delete()
        print(f"[DELETE] Executing DELETE for trip...")
        trip_delete = await session.execute(delete(Trip).where(Trip.id == trip_id_str))
        trip_deleted = trip_delete.rowcount
        print(f"[DELETE] Delete query returned rowcount of {trip_deleted}")
        
        # Explicit flush to send changes to database
        print(f"[DELETE] Flushing changes...")
        await session.flush()
        
        # Commit the transaction
        print(f"[DELETE] Committing transaction...")
        await session.commit()
        print(f"[DELETE] ✅ Trip {trip_id_str} and {steps_deleted} steps deleted successfully")
        
        return {"message": "Trip deleted successfully", "trip_id": str(trip_id), "steps_deleted": steps_deleted}
    except Exception as e:
        print(f"[DELETE] ❌ Exception during deletion: {str(e)}")
        import traceback
        traceback.print_exc()
        await session.rollback()
        raise

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import httpx

from app.api.deps import get_db, get_current_user
from app.services.trips import get_trip_with_steps
from app.utils.errors import NotFoundError, ForbiddenError

router = APIRouter(prefix="/analytics", tags=["analytics"])

INTELLIGENCE_SERVICE_URL = "http://localhost:8001"


def _build_trip_data(trip) -> dict:
    return {
        "trip_id": str(trip.id),
        "title": trip.title,
        "start_date": trip.start_date.isoformat() if trip.start_date else None,
        "steps": [
            {
                "lat": step.lat,
                "lng": step.lng,
                "altitude": step.altitude,
                "timestamp": step.timestamp.isoformat(),
                "note": step.note,
            }
            for step in trip.steps
        ],
    }


async def _fetch_intelligence(endpoint: str, **kwargs) -> dict:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.request(**kwargs, url=f"{INTELLIGENCE_SERVICE_URL}{endpoint}", timeout=10)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Travel Intelligence service error: {e}",
        )


async def _get_owned_trip(trip_id: UUID, current_user, session: AsyncSession):
    trip = await get_trip_with_steps(trip_id, session)
    if not trip:
        raise NotFoundError("Trip")
    if trip.user_id != current_user.id:
        raise ForbiddenError()
    return trip


@router.get("/trip/{trip_id}/stats")
async def get_trip_statistics(
    trip_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    trip = await _get_owned_trip(trip_id, current_user, session)
    return await _fetch_intelligence("/analyze/trip", method="POST", json=_build_trip_data(trip))


@router.get("/trip/{trip_id}/summary")
async def get_trip_summary(
    trip_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    trip = await _get_owned_trip(trip_id, current_user, session)
    return await _fetch_intelligence("/generate/summary", method="POST", json=_build_trip_data(trip))


@router.get("/location/insights")
async def get_location_insights(lat: float, lng: float):
    return await _fetch_intelligence("/insights/location", method="GET", params={"lat": lat, "lng": lng})


@router.post("/recommendations")
async def get_recommendations(current_user=Depends(get_current_user)):
    return await _fetch_intelligence("/recommend", method="GET")

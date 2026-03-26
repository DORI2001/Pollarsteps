"""
Analytics routes - Calls the Travel Intelligence microservice
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import httpx

from app.api.deps import get_db, get_current_user
from app.services.trips import get_trip_with_steps

router = APIRouter(prefix="/analytics", tags=["analytics"])

INTELLIGENCE_SERVICE_URL = "http://localhost:8001"


@router.get("/trip/{trip_id}/stats")
async def get_trip_statistics(
    trip_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get comprehensive trip statistics from the Travel Intelligence service
    """
    # Verify trip ownership
    trip_with_steps = await get_trip_with_steps(trip_id, session)
    if not trip_with_steps:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found"
        )
    if trip_with_steps.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden"
        )

    # Build trip data for the intelligence service
    trip_data = {
        "trip_id": str(trip_with_steps.id),
        "title": trip_with_steps.title,
        "start_date": trip_with_steps.start_date.isoformat() if trip_with_steps.start_date else None,
        "steps": [
            {
                "lat": step.lat,
                "lng": step.lng,
                "altitude": step.altitude,
                "timestamp": step.timestamp.isoformat(),
                "note": step.note,
            }
            for step in trip_with_steps.steps
        ],
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{INTELLIGENCE_SERVICE_URL}/analyze/trip",
                json=trip_data,
                timeout=10,
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Travel Intelligence service error: {str(e)}",
        )


@router.get("/trip/{trip_id}/summary")
async def get_trip_summary(
    trip_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get a beautiful trip summary from the Travel Intelligence service
    """
    # Verify trip ownership
    trip_with_steps = await get_trip_with_steps(trip_id, session)
    if not trip_with_steps:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found"
        )
    if trip_with_steps.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden"
        )

    # Build trip data for the intelligence service
    trip_data = {
        "trip_id": str(trip_with_steps.id),
        "title": trip_with_steps.title,
        "start_date": trip_with_steps.start_date.isoformat() if trip_with_steps.start_date else None,
        "steps": [
            {
                "lat": step.lat,
                "lng": step.lng,
                "altitude": step.altitude,
                "timestamp": step.timestamp.isoformat(),
                "note": step.note,
            }
            for step in trip_with_steps.steps
        ],
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{INTELLIGENCE_SERVICE_URL}/generate/summary",
                json=trip_data,
                timeout=10,
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Travel Intelligence service error: {str(e)}",
        )


@router.get("/location/insights")
async def get_location_insights(lat: float, lng: float):
    """
    Get insights about a specific location
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{INTELLIGENCE_SERVICE_URL}/insights/location",
                params={"lat": lat, "lng": lng},
                timeout=10,
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Travel Intelligence service error: {str(e)}",
        )


@router.post("/recommendations")
async def get_recommendations(current_user=Depends(get_current_user)):
    """
    Get personalized travel recommendations
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{INTELLIGENCE_SERVICE_URL}/recommend",
                timeout=10,
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Travel Intelligence service error: {str(e)}",
        )

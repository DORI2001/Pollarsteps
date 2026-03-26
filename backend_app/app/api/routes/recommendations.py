"""
Recommendations API Routes
Provides endpoints for getting AI-powered recommendations by location
"""
from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user
from app.services.recommendations import (
    get_recommendations,
    get_recommendations_for_step,
    LocationContext,
    RecommendationResponse
)
from typing import Optional

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/location", response_model=Optional[RecommendationResponse])
async def get_location_recommendations(
    location: str = Query(..., description="Location name (e.g., 'Tel Aviv, Israel')"),
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    rec_type: str = Query("all", description="Type: all, restaurants, attractions, activities"),
    budget: str = Query("moderate", description="Budget: budget, moderate, luxury"),
):
    """
    Get AI-powered recommendations for a location.
    
    Example:
    - GET /api/recommendations/location?location=Tel Aviv, Israel&lat=32.0853&lon=34.7818&rec_type=restaurants&budget=moderate
    - Returns: Personalized recommendations from Gemini AI
    """
    location_context = LocationContext(
        location_name=location,
        latitude=lat,
        longitude=lon,
        country="Unknown"
    )
    
    return await get_recommendations(
        location_context,
        recommendation_type=rec_type,
        budget=budget
    )


@router.get("/step/{step_id}", response_model=Optional[RecommendationResponse])
async def get_step_recommendations(
    step_id: str,
    rec_type: str = Query("all", description="Type: all, restaurants, attractions, activities"),
    budget: str = Query("moderate", description="Budget: budget, moderate, luxury"),
    session: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get recommendations for a specific trip step location.
    
    Example:
    - GET /recommendations/step/step-id-123
    - Returns: Recommendations based on that step's location
    """
    from app.models.step import Step
    from sqlalchemy import select
    
    # Get the step from database
    result = await session.execute(select(Step).where(Step.id == step_id))
    step = result.scalar_one_or_none()
    
    if not step:
        return None
    
    return await get_recommendations_for_step(
        step.name,
        step.lat,
        step.lng
    )

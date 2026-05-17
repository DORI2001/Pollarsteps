from typing import Optional
from pydantic import BaseModel


class LocationContext(BaseModel):
    """Input context for a recommendation request."""
    location_name: str
    latitude: float
    longitude: float
    country: Optional[str] = None
    trip_date: Optional[str] = None
    user_question: Optional[str] = None


class Recommendation(BaseModel):
    """A single place / activity recommendation."""
    title: str
    type: str  # restaurant | attraction | activity | hotel | …
    description: str
    why_recommended: str
    estimated_time: Optional[str] = None


class RecommendationResponse(BaseModel):
    """Top-level response returned to the API caller."""
    location: str
    recommendations: list[Recommendation]
    summary: str

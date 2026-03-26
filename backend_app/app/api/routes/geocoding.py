"""
Geocoding API Routes
Provides endpoints for location geocoding and reverse geocoding
"""
from fastapi import APIRouter, Query
from typing import Optional
from app.services.geocoding import geocode_location, reverse_geocode, GeocodeResult

router = APIRouter(prefix="/geocoding", tags=["geocoding"])


@router.get("/geocode", response_model=Optional[GeocodeResult])
async def geocode(
    location: str = Query(..., description="Location name to geocode (e.g., 'Tel Aviv, Israel')")
):
    """
    Geocode a location name to coordinates.
    
    Example:
    - GET /geocoding/geocode?location=Tel Aviv, Israel
    - Returns: {name, latitude, longitude, address, country, display_name}
    """
    return await geocode_location(location)


@router.get("/reverse-geocode", response_model=Optional[str])
async def reverse(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    """
    Reverse geocode coordinates to a location name.
    
    Example:
    - GET /geocoding/reverse-geocode?lat=32.0853&lon=34.7818
    - Returns: "Tel Aviv, Israel"
    """
    return await reverse_geocode(lat, lon)

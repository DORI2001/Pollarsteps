"""
Geocoding Service
Converts location names to coordinates using OpenStreetMap Nominatim API
"""
import aiohttp
import asyncio
import logging
from typing import Optional
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Nominatim API endpoint (free, no key required)
NOMINATIM_API = "https://nominatim.openstreetmap.org/search"


class GeocodeResult(BaseModel):
    """Geocoding result with location details"""
    name: str
    latitude: float
    longitude: float
    address: str
    country: str
    display_name: str


async def geocode_location(location_name: str) -> Optional[GeocodeResult]:
    """
    Convert a location name to coordinates using Nominatim.
    
    Args:
        location_name: The location to geocode (e.g., "Tel Aviv, Israel")
        
    Returns:
        GeocodeResult with coordinates, or None if not found
    """
    if not location_name or not location_name.strip():
        return None
    
    try:
        params = {
            "q": location_name,
            "format": "json",
            "limit": 1,
            "timeout": 10,
        }
        
        headers = {
            "User-Agent": "Pollarsteps/1.0 (Trip Planning App; https://github.com/user/polarsteps)",
        }
        
        # Use session to make async HTTP request
        async with aiohttp.ClientSession(headers=headers) as session:
            async with session.get(NOMINATIM_API, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status != 200:
                    logger.warning(f"Nominatim API returned {resp.status} for location: {location_name}")
                    return None
                
                results = await resp.json()
                
                if not results or len(results) == 0:
                    logger.info(f"No geocoding results found for: {location_name}")
                    return None
                
                result = results[0]
                
                # Extract country from the response (Nominatim returns address parts separately)
                country = "Unknown"
                if "address" in result:
                    address_dict = result["address"]
                    country = address_dict.get("country", address_dict.get("state", "Unknown"))
                
                return GeocodeResult(
                    name=location_name,
                    latitude=float(result["lat"]),
                    longitude=float(result["lon"]),
                    address=result.get("address", ""),
                    country=country,
                    display_name=result.get("display_name", location_name),
                )
    
    except asyncio.TimeoutError:
        logger.error(f"Geocoding timeout for location: {location_name}")
        return None
    except Exception as e:
        logger.error(f"Geocoding error for location '{location_name}': {str(e)}")
        return None


async def geocode_multiple(locations: list[str]) -> list[GeocodeResult]:
    """
    Geocode multiple locations in parallel.
    
    Args:
        locations: List of location names to geocode
        
    Returns:
        List of GeocodeResult objects
    """
    results = []
    for location in locations:
        result = await geocode_location(location)
        if result:
            results.append(result)
    return results


async def reverse_geocode(latitude: float, longitude: float) -> Optional[str]:
    """
    Convert coordinates to a location name (reverse geocoding).
    
    Args:
        latitude: Latitude coordinate
        longitude: Longitude coordinate
        
    Returns:
        Location name as string, or None if not found
    """
    if latitude is None or longitude is None:
        return None
    
    try:
        url = f"https://nominatim.openstreetmap.org/reverse"
        params = {
            "lat": latitude,
            "lon": longitude,
            "format": "json",
            "timeout": 10,
        }
        
        headers = {
            "User-Agent": "Pollarsteps/1.0 (Trip Planning App; https://github.com/user/polarsteps)",
        }
        
        async with aiohttp.ClientSession(headers=headers) as session:
            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status != 200:
                    return None
                
                result = await resp.json()
                return result.get("address", {}).get("city") or result.get("display_name", None)
    
    except Exception as e:
        logger.error(f"Reverse geocoding error: {str(e)}")
        return None

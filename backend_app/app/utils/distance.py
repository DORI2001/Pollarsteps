"""Distance calculation utilities."""
import math
from typing import List


def calculate_haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate distance between two coordinates using Haversine formula (km).
    
    Args:
        lat1: Latitude of first point
        lng1: Longitude of first point
        lat2: Latitude of second point
        lng2: Longitude of second point
    
    Returns:
        Distance in kilometers
    """
    R = 6371  # Earth radius in km
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = (
        math.sin(delta_lat / 2) ** 2 +
        math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def calculate_total_distance(steps: List) -> float:
    """
    Calculate total distance traveled across all steps.
    
    Args:
        steps: List of step objects with lat/lng attributes
    
    Returns:
        Total distance in kilometers
    """
    if not steps or len(steps) < 2:
        return 0.0
    
    total_distance = 0.0
    for i in range(len(steps) - 1):
        distance = calculate_haversine_distance(
            steps[i].lat,
            steps[i].lng,
            steps[i + 1].lat,
            steps[i + 1].lng
        )
        total_distance += distance
    
    return round(total_distance, 2)

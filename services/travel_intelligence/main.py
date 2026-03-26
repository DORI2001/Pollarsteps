"""
Travel Intelligence Microservice
Standalone service for trip analytics, insights, and enrichment
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from math import radians, cos, sin, asin, sqrt
import json

app = FastAPI(title="Travel Intelligence Service", version="1.0.0")


# ============================================================================
# Models
# ============================================================================

class LocationPoint(BaseModel):
    lat: float
    lng: float
    note: Optional[str] = None
    timestamp: Optional[str] = None
    altitude: Optional[float] = None


class TripData(BaseModel):
    trip_id: str
    title: str
    start_date: Optional[str] = None
    steps: List[LocationPoint]


class TripStats(BaseModel):
    trip_id: str
    total_distance_km: float
    total_steps: int
    duration_days: int
    countries_visited: int
    countries_list: List[str]
    avg_altitude_m: Optional[float]
    max_altitude_m: Optional[float]


class LocationInsight(BaseModel):
    location_name: str
    coordinates: tuple
    country: str
    continent: str
    fun_fact: str
    best_time_to_visit: str
    must_see: List[str]


class TravelRecommendation(BaseModel):
    recommendation: str
    confidence: float
    category: str  # "climate", "culture", "adventure", "relaxation"


# ============================================================================
# Utilities
# ============================================================================

COUNTRY_COORDINATES = {
    # Europe
    "France": (48.8566, 2.3522),
    "UK": (51.5074, -0.1278),
    "Germany": (52.5200, 13.4050),
    "Spain": (40.4168, -3.7038),
    "Italy": (41.9028, 12.4964),
    "Greece": (37.9838, 23.7275),
    # Asia
    "Japan": (35.6762, 139.6503),
    "Thailand": (13.7563, 100.5018),
    "Vietnam": (21.0285, 105.8542),
    "India": (28.7041, 77.1025),
    "China": (39.9042, 116.4074),
    # Americas
    "USA": (40.7128, -74.0060),
    "Canada": (45.4215, -75.6972),
    "Mexico": (19.4326, -99.1332),
    "Brazil": (-23.5505, -46.6333),
    # Australia & Oceania
    "Australia": (-33.8688, 151.2093),
    "New Zealand": (-41.2865, 174.7762),
}

FUN_FACTS = {
    "Paris": "The Eiffel Tower was originally intended to be temporary and was nearly demolished in 1909.",
    "London": "Big Ben is actually the name of the bell inside the clock tower, not the tower itself.",
    "Tokyo": "Tokyo experiences around 1,500 earthquakes per year due to its location on the Pacific Ring of Fire.",
    "New York": "There are approximately 8 million people living in NYC, more than the entire population of Greece.",
    "Sydney": "The Sydney Opera House has over 1 million roof tiles that need cleaning regularly.",
    "Barcelona": "Gaudí's Sagrada Família is still under construction and is expected to be completed by 2026.",
    "Dubai": "Dubai's Burj Khalifa is the world's tallest building at 828 meters high.",
    "Bangkok": "Bangkok officially has the longest city name in the world at 169 characters.",
}

BEST_TIME_TO_VISIT = {
    "Europe": "May-September (spring and summer)",
    "Asia": "November-February (cooler and dry season)",
    "Americas": "April-October (spring and fall)",
    "Australia": "September-November (spring)",
}

MUST_SEE_ATTRACTIONS = {
    "France": ["Eiffel Tower", "Louvre Museum", "Notre-Dame", "Palace of Versailles"],
    "Japan": ["Mount Fuji", "Fushimi Inari", "Shibuya Crossing", "Imperial Palace"],
    "USA": ["Statue of Liberty", "Golden Gate Bridge", "Grand Canyon", "Times Square"],
    "Italy": ["Colosseum", "Vatican City", "Venice Canals", "Leaning Tower of Pisa"],
    "Thailand": ["Grand Palace", "Wat Arun", "Floating Markets", "Phi Phi Islands"],
    "Australia": ["Sydney Opera House", "Great Barrier Reef", "Uluru", "Bondi Beach"],
}


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    Returns distance in kilometers
    """
    # Convert decimal degrees to radians
    lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])

    # Haversine formula
    dlng = lng2 - lng1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
    c = 2 * asin(sqrt(a))
    r = 6371  # Radius of earth in kilometers
    return c * r


def identify_country(lat: float, lng: float) -> str:
    """Identify country based on coordinates (simplified)"""
    # Find closest country
    min_distance = float('inf')
    closest_country = "Unknown"

    for country, (c_lat, c_lng) in COUNTRY_COORDINATES.items():
        distance = haversine_distance(lat, lng, c_lat, c_lng)
        if distance < min_distance:
            min_distance = distance
            closest_country = country

    return closest_country if min_distance < 2000 else "Unknown"


def get_continent(country: str) -> str:
    """Map country to continent"""
    europe = {"France", "UK", "Germany", "Spain", "Italy", "Greece"}
    asia = {"Japan", "Thailand", "Vietnam", "India", "China"}
    americas = {"USA", "Canada", "Mexico", "Brazil"}
    oceania = {"Australia", "New Zealand"}

    if country in europe:
        return "Europe"
    elif country in asia:
        return "Asia"
    elif country in americas:
        return "Americas"
    elif country in oceania:
        return "Oceania"
    return "World"


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Travel Intelligence"}


@app.post("/analyze/trip", response_model=TripStats)
async def analyze_trip(trip: TripData) -> TripStats:
    """
    Analyze a trip and return statistics
    - Total distance traveled
    - Number of countries visited
    - Trip duration
    - Average altitude
    """
    if not trip.steps or len(trip.steps) < 2:
        raise HTTPException(status_code=400, detail="Trip must have at least 2 steps")

    # Calculate total distance
    total_distance = 0.0
    for i in range(len(trip.steps) - 1):
        step1 = trip.steps[i]
        step2 = trip.steps[i + 1]
        distance = haversine_distance(step1.lat, step1.lng, step2.lat, step2.lng)
        total_distance += distance

    # Identify countries
    countries_set = set()
    for step in trip.steps:
        country = identify_country(step.lat, step.lng)
        if country != "Unknown":
            countries_set.add(country)

    # Calculate duration
    duration_days = 0
    if trip.start_date and trip.steps[-1].timestamp:
        try:
            start = datetime.fromisoformat(trip.start_date.replace("Z", "+00:00"))
            end = datetime.fromisoformat(trip.steps[-1].timestamp.replace("Z", "+00:00"))
            duration_days = (end - start).days + 1
        except:
            duration_days = len(trip.steps)
    else:
        duration_days = len(trip.steps)

    # Calculate altitude stats
    altitudes = [s.altitude for s in trip.steps if s.altitude]
    avg_altitude = sum(altitudes) / len(altitudes) if altitudes else None
    max_altitude = max(altitudes) if altitudes else None

    return TripStats(
        trip_id=trip.trip_id,
        total_distance_km=round(total_distance, 2),
        total_steps=len(trip.steps),
        duration_days=max(duration_days, 1),
        countries_visited=len(countries_set),
        countries_list=sorted(list(countries_set)),
        avg_altitude_m=round(avg_altitude, 2) if avg_altitude else None,
        max_altitude_m=round(max_altitude, 2) if max_altitude else None,
    )


@app.get("/insights/location", response_model=LocationInsight)
async def get_location_insight(lat: float, lng: float) -> LocationInsight:
    """
    Get insights about a specific location
    - Country and continent
    - Fun facts
    - Must-see attractions
    - Best time to visit
    """
    country = identify_country(lat, lng)
    continent = get_continent(country)

    fun_fact = FUN_FACTS.get(country, f"{country} is a fascinating destination.")
    best_time = BEST_TIME_TO_VISIT.get(continent, "Year-round")
    must_see = MUST_SEE_ATTRACTIONS.get(country, ["Local markets", "Street food", "Local culture"])

    return LocationInsight(
        location_name=country,
        coordinates=(lat, lng),
        country=country,
        continent=continent,
        fun_fact=fun_fact,
        best_time_to_visit=best_time,
        must_see=must_see,
    )


@app.get("/recommend")
async def get_travel_recommendation(trip: Optional[TripData] = None) -> List[TravelRecommendation]:
    """
    Get personalized travel recommendations based on trip history
    """
    recommendations = []

    if trip and trip.steps:
        visited_continents = set()
        total_distance = 0

        for step in trip.steps:
            country = identify_country(step.lat, step.lng)
            continent = get_continent(country)
            visited_continents.add(continent)

        # Generate recommendations based on travel pattern
        if "Europe" in visited_continents and "Asia" not in visited_continents:
            recommendations.append(
                TravelRecommendation(
                    recommendation="Have you considered exploring the temples of Southeast Asia? Perfect next stop after Europe!",
                    confidence=0.9,
                    category="culture",
                )
            )

        if len(trip.steps) > 10:
            recommendations.append(
                TravelRecommendation(
                    recommendation="You're an adventurous traveler! Consider trekking in Nepal or Patagonia for your next challenge.",
                    confidence=0.85,
                    category="adventure",
                )
            )

        if len(visited_continents) >= 3:
            recommendations.append(
                TravelRecommendation(
                    recommendation="You're a true globetrotter! Why not experience Africa's safaris or New Zealand's landscapes?",
                    confidence=0.8,
                    category="adventure",
                )
            )

    # Default recommendations
    if not recommendations:
        recommendations = [
            TravelRecommendation(
                recommendation="Start your journey with iconic European cities - Paris, Rome, and Barcelona.",
                confidence=0.95,
                category="culture",
            ),
            TravelRecommendation(
                recommendation="Experience the temples and culture of Thailand, Japan, or Vietnam.",
                confidence=0.90,
                category="culture",
            ),
            TravelRecommendation(
                recommendation="Seek adventure in Patagonia, Peru, or the Swiss Alps.",
                confidence=0.85,
                category="adventure",
            ),
        ]

    return recommendations


@app.post("/generate/summary")
async def generate_trip_summary(trip: TripData) -> dict:
    """Generate a beautiful summary of the trip"""
    stats = await analyze_trip(trip)

    summary = f"""
    🌍 Trip Summary: {trip.title}
    
    📊 Statistics:
    • Total Distance: {stats.total_distance_km} km
    • Steps/Locations: {stats.total_steps}
    • Duration: {stats.duration_days} days
    • Countries Visited: {stats.countries_visited}
    • Countries: {', '.join(stats.countries_list)}
    
    ⛰️ Altitude Stats:
    • Average: {stats.avg_altitude_m}m
    • Maximum: {stats.max_altitude_m}m
    
    ✨ Highlights:
    • You traveled {stats.total_distance_km} kilometers
    • You visited {stats.countries_visited} countries in {stats.duration_days} days
    • An average of {round(stats.total_distance_km / stats.duration_days, 2)} km per day
    
    That's an incredible adventure! 🚀
    """.strip()

    return {
        "trip_id": trip.trip_id,
        "title": trip.title,
        "summary": summary,
        "stats": stats.model_dump(),
    }


# ============================================================================
# Batch Endpoints
# ============================================================================

@app.post("/batch/enrich")
async def batch_enrich_locations(locations: List[LocationPoint]) -> List[dict]:
    """
    Enrich multiple locations with insights
    """
    enriched = []
    for loc in locations:
        country = identify_country(loc.lat, loc.lng)
        continent = get_continent(country)
        fun_fact = FUN_FACTS.get(country, "")

        enriched.append({
            "lat": loc.lat,
            "lng": loc.lng,
            "country": country,
            "continent": continent,
            "fun_fact": fun_fact,
            "note": loc.note,
        })

    return enriched


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

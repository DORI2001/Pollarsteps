"""
Recommendations Service
Provides AI-powered recommendations for attractions, restaurants, activities
based on current location using Anthropic Claude API
"""
import aiohttp
import logging
import os
from typing import Optional
from pydantic import BaseModel
from app.core.config import get_settings

logger = logging.getLogger(__name__)

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"


def get_api_key() -> str:
    """Get the Anthropic API key from settings, environment, or .env file directly."""
    # Try settings first
    settings = get_settings()
    key = settings.anthropic_api_key

    if not key:
        key = os.getenv("ANTHROPIC_API_KEY", "")

    # Fallback: read .env file directly
    if not key:
        try:
            env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
            env_path = os.path.abspath(env_path)
            if os.path.exists(env_path):
                with open(env_path, "r") as f:
                    content = f.read()
                    for line in content.split('\n'):
                        line = line.strip()
                        if line.startswith("ANTHROPIC_API_KEY=") and not line.startswith("#"):
                            key = line.split("=", 1)[1].strip()
                            break
        except Exception as e:
            logger.error(f"Error reading .env: {e}")
            pass

    return key


class LocationContext(BaseModel):
    """Context for recommendations"""
    location_name: str
    latitude: float
    longitude: float
    country: Optional[str] = None
    trip_date: Optional[str] = None


class Recommendation(BaseModel):
    """A single recommendation"""
    title: str
    type: str  # restaurant, attraction, activity, hotel, etc
    description: str
    why_recommended: str
    estimated_time: Optional[str] = None


class RecommendationResponse(BaseModel):
    """Response with recommendations"""
    location: str
    recommendations: list[Recommendation]
    summary: str


async def get_recommendations(
    location_context: LocationContext,
    recommendation_type: str = "all",  # all, restaurants, attractions, activities
    budget: str = "moderate"  # budget, moderate, luxury
) -> Optional[RecommendationResponse]:
    """
    Get AI-powered recommendations for a location.
    
    Args:
        location_context: Location details (name, coordinates)
        recommendation_type: Type of recommendations to get
        budget: Budget level for recommendations
        
    Returns:
        RecommendationResponse with list of recommendations
    """
    try:
        # Check API key dynamically
        api_key = get_api_key()
        
        if not api_key:
            logger.warning(f"No Claude API key configured. Returning mock recommendations for {location_context.location_name}")
            return get_mock_recommendations(location_context, recommendation_type, budget)
        
        # Build the prompt for the AI agent
        prompt = build_recommendation_prompt(
            location_context,
            recommendation_type,
            budget
        )
        
        # Call LLM API
        recommendations_text = await call_llm_api(prompt)
        
        if not recommendations_text:
            logger.warning(f"No recommendations received for {location_context.location_name}. Using mock recommendations.")
            return get_mock_recommendations(location_context, recommendation_type, budget)
        
        # Parse the response
        parsed_recommendations = parse_recommendations(recommendations_text)
        
        return RecommendationResponse(
            location=location_context.location_name,
            recommendations=parsed_recommendations,
            summary=f"Top recommendations for {location_context.location_name}"
        )
    
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        return None


def get_mock_recommendations(
    location_context: LocationContext,
    recommendation_type: str = "all",
    budget: str = "moderate"
) -> RecommendationResponse:
    """
    Return mock recommendations for development/testing when API key is not available.
    """
    mock_recs_by_type = {
        "restaurants": [
            Recommendation(
                title="Mediterranean Cuisine House",
                type="restaurant",
                description="Traditional Mediterranean restaurant with stunning rooftop views",
                why_recommended="Highly rated for authentic Italian and Greek cuisine",
                estimated_time="1.5 hours"
            ),
            Recommendation(
                title="Local Food Market",
                type="restaurant",
                description="Vibrant market with fresh local produce and food stalls",
                why_recommended="Best place to experience authentic local flavors",
                estimated_time="2 hours"
            ),
        ],
        "attractions": [
            Recommendation(
                title="Historical City Center",
                type="attraction",
                description="Ancient streets and historic monuments",
                why_recommended="Must-see for history enthusiasts",
                estimated_time="3 hours"
            ),
            Recommendation(
                title="Beach Promenade",
                type="attraction",
                description="Beautiful seaside walk with cafes and views",
                why_recommended="Perfect for relaxation and sunset views",
                estimated_time="2 hours"
            ),
        ],
        "activities": [
            Recommendation(
                title="City Walking Tour",
                type="activity",
                description="Guided tour through the historic districts",
                why_recommended="Great way to learn about local culture",
                estimated_time="4 hours"
            ),
            Recommendation(
                title="Water Sports",
                type="activity",
                description="Kayaking, paddleboarding, and swimming",
                why_recommended="Perfect activity for adventure seekers",
                estimated_time="3 hours"
            ),
        ]
    }
    
    # Get recommendations based on type
    if recommendation_type == "all":
        mock_recommendations = (
            mock_recs_by_type.get("restaurants", []) +
            mock_recs_by_type.get("attractions", []) +
            mock_recs_by_type.get("activities", [])
        )
    else:
        mock_recommendations = mock_recs_by_type.get(recommendation_type, [])
    
    return RecommendationResponse(
        location=location_context.location_name,
        recommendations=mock_recommendations,
        summary=f"✨ Recommended places and activities in {location_context.location_name} (Mock Data - Configure ANTHROPIC_API_KEY for real recommendations)"
    )


def build_recommendation_prompt(
    location: LocationContext,
    rec_type: str,
    budget: str
) -> str:
    """Build a prompt for the AI agent"""
    
    type_instructions = {
        "all": "restaurants, cafes, attractions, activities, hotels, museums, and landmarks",
        "restaurants": "restaurants and cafes",
        "attractions": "tourist attractions, museums, and landmarks",
        "activities": "activities, tours, and experiences"
    }
    
    prompt = f"""You are a travel recommendation expert. Based on the following location, provide {type_instructions.get(rec_type, 'all')} recommendations.

Location: {location.location_name}
Latitude: {location.latitude}
Longitude: {location.longitude}
Country: {location.country or "Unknown"}
Budget Level: {budget}

Please provide 5 personalized recommendations in the following JSON format:
{{
    "recommendations": [
        {{
            "title": "Place Name",
            "type": "restaurant/attraction/activity/etc",
            "description": "Brief description of the place",
            "why_recommended": "Why this is good for travelers",
            "estimated_time": "How long to spend there"
        }}
    ]
}}

Focus on popular, highly-rated places. Include a mix of must-see attractions and hidden gems."""
    
    return prompt


async def call_llm_api(prompt: str) -> Optional[str]:
    """
    Call the Anthropic Claude API to get recommendations.
    """
    try:
        api_key = get_api_key()

        payload = {
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 1024,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }

        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                ANTHROPIC_API_URL,
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    logger.error(f"Claude API error: {resp.status} - {error_text}")
                    return None

                data = await resp.json()

                # Claude API returns text in content[0].text
                if "content" in data and len(data["content"]) > 0:
                    return data["content"][0]["text"]

                logger.error("Unexpected Claude API response structure")
                return None

    except Exception as e:
        logger.error(f"Claude API call failed: {str(e)}")
        return None


def parse_recommendations(response_text: str) -> list[Recommendation]:
    """
    Parse LLM response into Recommendation objects.
    """
    try:
        import json
        import re
        
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if not json_match:
            logger.warning("Could not find JSON in LLM response")
            return []
        
        json_str = json_match.group()
        data = json.loads(json_str)
        
        recommendations = []
        for rec in data.get("recommendations", []):
            recommendations.append(Recommendation(
                title=rec.get("title", ""),
                type=rec.get("type", "attraction"),
                description=rec.get("description", ""),
                why_recommended=rec.get("why_recommended", ""),
                estimated_time=rec.get("estimated_time")
            ))
        
        return recommendations
    
    except Exception as e:
        logger.error(f"Error parsing recommendations: {str(e)}")
        return []


async def get_recommendations_for_step(
    step_name: str,
    lat: float,
    lng: float
) -> Optional[RecommendationResponse]:
    """
    Simplified method to get recommendations for a trip step.
    """
    location_context = LocationContext(
        location_name=step_name,
        latitude=lat,
        longitude=lng
    )
    
    return await get_recommendations(location_context)

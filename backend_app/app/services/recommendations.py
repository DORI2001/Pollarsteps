"""
Recommendations Service
Provides AI-powered recommendations for attractions, restaurants, activities
based on current location using Gemini
"""
import asyncio
import logging
import os
from typing import Optional

import aiohttp
from pydantic import BaseModel

from app.core.config import get_settings
from app.utils.config import load_env_variable, load_from_env_file

logger = logging.getLogger(__name__)


def get_api_key() -> str:
    """Get the Gemini API key from settings, environment, or .env file."""
    # Try settings first
    settings = get_settings()
    key = getattr(settings, "gemini_api_key", None) or ""

    # Try environment variable
    if not key:
        key = load_env_variable("GEMINI_API_KEY", default="")
    
    # Try .env file as fallback
    if not key:
        env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
        key = load_from_env_file(env_path, "GEMINI_API_KEY") or ""
    
    if not key:
        logger.warning("No Gemini API key found — will return mock recommendations")
    
    return key


class LocationContext(BaseModel):
    """Context for recommendations"""
    location_name: str
    latitude: float
    longitude: float
    country: Optional[str] = None
    trip_date: Optional[str] = None
    user_question: Optional[str] = None


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
    budget: str = "moderate",  # budget, moderate, luxury
    user_question: Optional[str] = None,
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
            logger.warning(f"No Gemini API key configured. Returning mock recommendations for {location_context.location_name}")
            return get_mock_recommendations(location_context, recommendation_type, budget)
        
        # Build the prompt for the AI agent
        question = user_question or location_context.user_question
        prompt = build_recommendation_prompt(
            location_context,
            recommendation_type,
            budget,
            question,
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
        summary=f"✨ Recommended places and activities in {location_context.location_name} (Mock Data - Configure GEMINI_API_KEY for real recommendations)"
    )


def build_recommendation_prompt(
    location: LocationContext,
    rec_type: str,
    budget: str,
    user_question: Optional[str] = None
) -> str:
    """Build a prompt for the AI agent"""
    
    type_instructions = {
        "all": "restaurants, cafes, attractions, activities, hotels, museums, and landmarks",
        "restaurants": "restaurants and cafes",
        "attractions": "tourist attractions, museums, and landmarks",
        "activities": "activities, tours, and experiences"
    }
    
    question_line = f"Traveler question: {user_question}" if user_question else "Traveler question: Find great places to visit."
    prompt = f"""You are a travel recommendation expert. Based on the following location, provide {type_instructions.get(rec_type, 'all')} recommendations.

Location: {location.location_name}
Latitude: {location.latitude}
Longitude: {location.longitude}
Country: {location.country or "Unknown"}
Budget Level: {budget}
{question_line}

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

Focus on popular, highly-rated places. Include a mix of must-see attractions and hidden gems. Make sure suggestions align with the traveler question when provided."""
    
    return prompt


async def call_llm_api(prompt: str) -> Optional[str]:
    """Call Gemini via REST, trying models in order with one retry on rate-limit."""
    api_key = get_api_key()
    if not api_key:
        return None

    # Try models in order — each has its own quota pool
    models = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
        "gemini-pro",
    ]
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1024},
    }

    async with aiohttp.ClientSession() as session:
        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            for attempt in range(2):  # up to 2 attempts per model
                try:
                    async with session.post(
                        url,
                        params={"key": api_key},
                        json=payload,
                        timeout=aiohttp.ClientTimeout(total=30),
                    ) as resp:
                        if resp.status == 429:
                            # Rate limited — wait 2s then retry once
                            logger.warning(f"Gemini rate limit on {model}, attempt {attempt+1}")
                            if attempt == 0:
                                await asyncio.sleep(2)
                                continue
                            else:
                                break  # Try next model
                        if resp.status != 200:
                            err_text = await resp.text()
                            logger.error(f"Gemini {model} error {resp.status}: {err_text[:200]}")
                            break  # Try next model
                        data = await resp.json()
                        try:
                            text = data["candidates"][0]["content"]["parts"][0]["text"]
                            logger.info(f"Gemini response from {model}")
                            return text
                        except Exception:
                            logger.error(f"Unexpected response structure from {model}")
                            break
                except Exception as e:
                    logger.error(f"Gemini {model} call failed: {e}")
                    break

    logger.error("All Gemini models failed or rate-limited")
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

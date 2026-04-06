"""
Recommendations Service
Provides AI-powered recommendations for attractions, restaurants, and activities
based on the current location using the Gemini API.
"""
import asyncio
import json
import logging
import re
from typing import Optional

import aiohttp
from pydantic import BaseModel

from app.core.config import get_settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_api_key() -> str:
    """Return the Gemini API key from application settings (reads .env automatically)."""
    key = get_settings().gemini_api_key or ""
    if not key:
        logger.warning("No Gemini API key configured — mock recommendations will be used")
    return key


def _build_prompt(
    location: LocationContext,
    rec_type: str,
    budget: str,
    user_question: Optional[str],
) -> str:
    type_map = {
        "all": "restaurants, cafes, attractions, activities, museums, and landmarks",
        "restaurants": "restaurants and cafes",
        "attractions": "tourist attractions, museums, and landmarks",
        "activities": "activities, tours, and experiences",
    }
    question_line = (
        f"Traveler question: {user_question}"
        if user_question
        else "Traveler question: Find great places to visit."
    )
    return f"""You are a travel recommendation expert. Provide {type_map.get(rec_type, type_map['all'])} for the location below.

Location: {location.location_name}
Latitude: {location.latitude}
Longitude: {location.longitude}
Country: {location.country or "Unknown"}
Budget: {budget}
{question_line}

Respond with exactly this JSON (no extra text):
{{
    "recommendations": [
        {{
            "title": "Place Name",
            "type": "restaurant/attraction/activity/etc",
            "description": "Brief description",
            "why_recommended": "Why this suits travelers",
            "estimated_time": "Time to spend here"
        }}
    ]
}}

Provide 5 recommendations. Mix well-known spots with hidden gems. Align with the traveler question when given."""


def _parse_recommendations(text: str) -> list[Recommendation]:
    """Extract Recommendation objects from a raw LLM response string."""
    try:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            logger.warning("No JSON found in LLM response")
            return []
        data = json.loads(match.group())
        return [
            Recommendation(
                title=r.get("title", ""),
                type=r.get("type", "attraction"),
                description=r.get("description", ""),
                why_recommended=r.get("why_recommended", ""),
                estimated_time=r.get("estimated_time"),
            )
            for r in data.get("recommendations", [])
        ]
    except Exception as e:
        logger.error(f"Failed to parse LLM response: {e}")
        return []


async def _call_gemini(prompt: str) -> Optional[str]:
    """
    Call the Gemini REST API, trying two models with one rate-limit retry each.
    Returns the raw text response, or None on failure.
    """
    api_key = _get_api_key()
    if not api_key:
        return None

    models = ["gemini-1.5-flash", "gemini-1.5-flash-8b"]
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1024},
    }

    async with aiohttp.ClientSession() as session:
        for model in models:
            url = (
                f"https://generativelanguage.googleapis.com/v1beta"
                f"/models/{model}:generateContent"
            )
            for attempt in range(2):
                try:
                    async with session.post(
                        url,
                        params={"key": api_key},
                        json=payload,
                        timeout=aiohttp.ClientTimeout(total=30),
                    ) as resp:
                        if resp.status == 429:
                            logger.warning(f"Gemini rate-limit on {model} (attempt {attempt + 1})")
                            if attempt == 0:
                                await asyncio.sleep(2)
                                continue
                            break  # try next model
                        if resp.status != 200:
                            logger.error(
                                f"Gemini {model} returned {resp.status}: "
                                f"{(await resp.text())[:200]}"
                            )
                            break
                        data = await resp.json()
                        return data["candidates"][0]["content"]["parts"][0]["text"]
                except Exception as e:
                    logger.error(f"Gemini {model} request failed: {e}")
                    break

    logger.error("All Gemini models failed or were rate-limited")
    return None


def _mock_response(location: LocationContext, rec_type: str) -> RecommendationResponse:
    """Fallback recommendations used when no API key is configured."""
    by_type: dict[str, list[Recommendation]] = {
        "restaurants": [
            Recommendation(
                title="Mediterranean Cuisine House",
                type="restaurant",
                description="Traditional Mediterranean restaurant with rooftop views",
                why_recommended="Highly rated for authentic local cuisine",
                estimated_time="1.5 hours",
            ),
            Recommendation(
                title="Local Food Market",
                type="restaurant",
                description="Vibrant market with fresh produce and street food",
                why_recommended="Best place to experience authentic local flavors",
                estimated_time="2 hours",
            ),
        ],
        "attractions": [
            Recommendation(
                title="Historical City Center",
                type="attraction",
                description="Ancient streets and historic monuments",
                why_recommended="Must-see for history enthusiasts",
                estimated_time="3 hours",
            ),
            Recommendation(
                title="Beach Promenade",
                type="attraction",
                description="Beautiful seaside walk with cafes and views",
                why_recommended="Perfect for relaxation and sunset views",
                estimated_time="2 hours",
            ),
        ],
        "activities": [
            Recommendation(
                title="City Walking Tour",
                type="activity",
                description="Guided tour through the historic districts",
                why_recommended="Great way to learn about local culture",
                estimated_time="4 hours",
            ),
            Recommendation(
                title="Water Sports",
                type="activity",
                description="Kayaking, paddleboarding, and swimming",
                why_recommended="Perfect for adventure seekers",
                estimated_time="3 hours",
            ),
        ],
    }

    if rec_type == "all":
        recs = by_type["restaurants"] + by_type["attractions"] + by_type["activities"]
    else:
        recs = by_type.get(rec_type, [])

    return RecommendationResponse(
        location=location.location_name,
        recommendations=recs,
        summary=(
            f"✨ Recommendations for {location.location_name} "
            f"(mock data — set GEMINI_API_KEY for live results)"
        ),
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def get_recommendations(
    location_context: LocationContext,
    recommendation_type: str = "all",
    budget: str = "moderate",
    user_question: Optional[str] = None,
) -> Optional[RecommendationResponse]:
    """Return AI-powered recommendations for a location, falling back to mock data."""
    try:
        if not _get_api_key():
            return _mock_response(location_context, recommendation_type)

        question = user_question or location_context.user_question
        prompt = _build_prompt(location_context, recommendation_type, budget, question)
        raw = await _call_gemini(prompt)

        if not raw:
            logger.warning(f"Empty Gemini response for {location_context.location_name}, using mock")
            return _mock_response(location_context, recommendation_type)

        recs = _parse_recommendations(raw)
        return RecommendationResponse(
            location=location_context.location_name,
            recommendations=recs,
            summary=f"Top recommendations for {location_context.location_name}",
        )
    except Exception as e:
        logger.error(f"get_recommendations failed: {e}")
        return None


async def get_recommendations_for_step(
    step_name: str,
    lat: float,
    lng: float,
) -> Optional[RecommendationResponse]:
    """Convenience wrapper for a single trip step."""
    return await get_recommendations(
        LocationContext(location_name=step_name, latitude=lat, longitude=lng)
    )

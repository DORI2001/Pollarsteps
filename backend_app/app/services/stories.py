from typing import List
from uuid import UUID
import secrets
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.trip import Trip
from app.models.step import Step
from app.models.story import Story, StorySlide
from app.schemas.story import StoryCreate
from sqlalchemy.orm import attributes


def _select_highlight_steps(steps: List[Step], max_slides: int) -> List[Step]:
    with_images = [s for s in steps if s.image_url]
    remaining = [s for s in steps if not s.image_url]
    ordered = with_images + remaining
    return ordered[:max_slides]


async def generate_story(payload: StoryCreate, session: AsyncSession, current_user) -> Story:
    trip = await session.get(Trip, str(payload.trip_id))
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    if trip.user_id != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    result = await session.execute(
        select(Step).where(Step.trip_id == trip.id).order_by(Step.timestamp.asc())
    )
    steps = result.scalars().all()
    if not steps:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Trip has no steps to build a story")

    story = Story(
        trip_id=trip.id,
        status="ready",
        is_public=payload.shareable,
        share_token=secrets.token_urlsafe(16) if payload.shareable else None,
        song_provider=payload.song_provider,
        song_id=payload.song_id,
        song_title=payload.song_title,
        song_thumbnail=payload.song_thumbnail,
        song_start_time=payload.song_start_time or 0,
        song_duration=payload.song_duration or 15,
    )
    session.add(story)
    await session.flush()

    selected_steps = _select_highlight_steps(steps, payload.max_slides)
    for idx, step in enumerate(selected_steps):
        caption = step.note or step.location_name or "Memory"
        map_hint = None
        if payload.include_map:
            map_hint = f"geo:{step.lat:.4f},{step.lng:.4f}"
        slide = StorySlide(
            story_id=story.id,
            order_index=idx,
            image_url=step.image_url,
            caption=caption,
            map_tile_url=map_hint,
            duration_ms=4000,
        )
        session.add(slide)

    await session.commit()
    await session.refresh(story)
    slides_result = await session.execute(
        select(StorySlide).where(StorySlide.story_id == story.id).order_by(StorySlide.order_index.asc())
    )
    attributes.set_committed_value(story, "slides", list(slides_result.scalars().all()))
    return story


async def get_story(story_id: UUID, session: AsyncSession, current_user) -> Story:
    story = await session.get(Story, str(story_id))
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")

    trip = await session.get(Trip, story.trip_id)
    if not trip or trip.user_id != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    slides_result = await session.execute(
        select(StorySlide).where(StorySlide.story_id == story.id).order_by(StorySlide.order_index.asc())
    )
    attributes.set_committed_value(story, "slides", list(slides_result.scalars().all()))
    return story


async def get_public_story(token: str, session: AsyncSession) -> Story:
    result = await session.execute(select(Story).where(Story.share_token == token, Story.is_public == True))
    story = result.scalar_one_or_none()
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")
    slides_result = await session.execute(
        select(StorySlide).where(StorySlide.story_id == story.id).order_by(StorySlide.order_index.asc())
    )
    attributes.set_committed_value(story, "slides", list(slides_result.scalars().all()))
    return story

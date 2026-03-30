from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.schemas.story import StoryCreate, StoryRead
from app.services.stories import generate_story, get_story, get_public_story

router = APIRouter(prefix="/stories", tags=["stories"])


@router.post("/", response_model=StoryRead)
async def create_story(payload: StoryCreate, session: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    story = await generate_story(payload, session, current_user)
    return StoryRead.model_validate(story)


@router.get("/{story_id}", response_model=StoryRead)
async def fetch_story(story_id: UUID, session: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    story = await get_story(story_id, session, current_user)
    return StoryRead.model_validate(story)


@router.get("/public/{share_token}", response_model=StoryRead)
async def fetch_public_story(share_token: str, session: AsyncSession = Depends(get_db)):
    story = await get_public_story(share_token, session)
    return StoryRead.model_validate(story)

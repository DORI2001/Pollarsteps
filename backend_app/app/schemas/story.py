from datetime import datetime
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel, Field


class StoryCreate(BaseModel):
    trip_id: UUID
    max_slides: int = Field(default=12, ge=1, le=50)
    include_map: bool = True
    shareable: bool = True
    song_provider: Optional[str] = None
    song_id: Optional[str] = None
    song_title: Optional[str] = None
    song_thumbnail: Optional[str] = None
    song_start_time: Optional[int] = 0
    song_duration: Optional[int] = 15


class StorySlideRead(BaseModel):
    id: UUID
    order_index: int
    image_url: Optional[str] = None
    caption: Optional[str] = None
    map_tile_url: Optional[str] = None
    duration_ms: int = 4000

    class Config:
        from_attributes = True


class StoryRead(BaseModel):
    id: UUID
    trip_id: UUID
    status: str
    share_token: Optional[str] = None
    is_public: bool = False
    song_provider: Optional[str] = None
    song_id: Optional[str] = None
    song_title: Optional[str] = None
    song_thumbnail: Optional[str] = None
    song_start_time: Optional[int] = 0
    song_duration: Optional[int] = 15
    created_at: datetime
    updated_at: datetime
    slides: List[StorySlideRead] = []

    class Config:
        from_attributes = True

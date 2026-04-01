from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from typing import List, Optional


class StepBase(BaseModel):
    trip_id: UUID
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    altitude: Optional[float] = None
    timestamp: Optional[datetime] = None
    note: Optional[str] = None
    image_url: Optional[str] = None
    location_name: Optional[str] = None
    client_uuid: UUID
    duration_days: Optional[int] = None  # How many days at this location


class StepCreate(StepBase):
    pass


class StepUpdate(BaseModel):
    location_name: Optional[str] = None
    note: Optional[str] = None
    duration_days: Optional[int] = None


class StepImageRead(BaseModel):
    id: UUID
    image_url: str
    caption: Optional[str] = None
    order_index: int = 0

    class Config:
        from_attributes = True


class StepRead(StepBase):
    id: UUID
    timestamp: datetime
    images: List[StepImageRead] = []

    class Config:
        from_attributes = True

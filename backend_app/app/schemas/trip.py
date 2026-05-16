from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, computed_field
from typing import List, Optional
from app.schemas.step import StepRead


class TripBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_public: bool = False


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_public: Optional[bool] = None


class TripRead(TripBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    total_distance: Optional[float] = 0.0
    total_steps: Optional[int] = 0
    share_token: Optional[str] = None

    class Config:
        from_attributes = True


class TripSplitRequest(BaseModel):
    new_trip_title: str
    step_ids: List[str]


class TripSplitResponse(BaseModel):
    original_trip: TripRead
    new_trip: TripRead


class TripWithSteps(TripRead):
    steps: List[StepRead]
    route_geojson: Optional[dict] = None

    @computed_field
    @property
    def total_days_travelled(self) -> int:
        if not self.steps or len(self.steps) < 2:
            return 0
        first_step = min(self.steps, key=lambda s: s.timestamp)
        last_step = max(self.steps, key=lambda s: s.timestamp)
        return (last_step.timestamp - first_step.timestamp).days + 1

    @computed_field
    @property
    def trip_duration_days(self) -> int:
        if self.start_date and self.end_date:
            return (self.end_date - self.start_date).days + 1
        if self.start_date:
            return (date.today() - self.start_date).days + 1
        return 0

    @computed_field
    @property
    def total_days_at_destinations(self) -> int:
        return sum(step.duration_days or 0 for step in (self.steps or []))

    @computed_field
    @property
    def location_count(self) -> int:
        return len(self.steps) if self.steps else 0

    @computed_field
    @property
    def average_days_per_location(self) -> float:
        if not self.steps:
            return 0.0
        total_days = self.total_days_at_destinations
        return total_days / len(self.steps) if total_days > 0 else 0.0

    class Config:
        from_attributes = True

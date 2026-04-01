from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel
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
    
    @property
    def total_days_travelled(self) -> int:
        """Calculate total days travelled based on step timestamps"""
        if not self.steps or len(self.steps) < 2:
            return 0
        
        first_step = min(self.steps, key=lambda s: s.timestamp)
        last_step = max(self.steps, key=lambda s: s.timestamp)
        delta = last_step.timestamp - first_step.timestamp
        return delta.days + 1
    
    @property
    def trip_duration_days(self) -> int:
        """Calculate trip duration from start_date to end_date"""
        if self.start_date and self.end_date:
            delta = self.end_date - self.start_date
            return delta.days + 1
        elif self.start_date:
            # If no end_date, calculate from start_date to now
            from datetime import date
            today = date.today()
            delta = today - self.start_date
            return delta.days + 1
        return 0
    
    @property
    def total_days_at_destinations(self) -> int:
        """Sum of all duration_days from steps"""
        if not self.steps:
            return 0
        return sum(step.duration_days or 0 for step in self.steps)
    
    @property
    def location_count(self) -> int:
        """Number of unique locations visited"""
        return len(self.steps) if self.steps else 0
    
    @property
    def average_days_per_location(self) -> float:
        """Average days spent at each location"""
        if not self.steps or len(self.steps) == 0:
            return 0.0
        total_days = self.total_days_at_destinations
        return total_days / len(self.steps) if total_days > 0 else 0.0

    class Config:
        from_attributes = True

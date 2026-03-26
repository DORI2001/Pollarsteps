from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class ChroniclerRequest(BaseModel):
    step_id: UUID
    location_name: str
    image_url: Optional[str] = None
    image_metadata: Optional[dict] = None


class ChroniclerResponse(BaseModel):
    poetic_journal: str

from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    email: EmailStr
    username: str


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: UUID
    profile_img: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.auth import RegisterRequest, LoginRequest, TokenPair, ChangePasswordRequest
from app.schemas.user import UserRead
from app.services.auth import register, login, refresh_auth_token, change_password
from app.api.deps import get_db, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/register", response_model=TokenPair)
async def register_user(payload: RegisterRequest, session: AsyncSession = Depends(get_db)):
    return await register(payload, session)


@router.post("/login", response_model=TokenPair)
async def login_user(payload: LoginRequest, session: AsyncSession = Depends(get_db)):
    return await login(payload, session)


@router.post("/refresh", response_model=TokenPair)
async def refresh_token(payload: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    return await refresh_auth_token(payload.refresh_token)


@router.get("/me", response_model=UserRead)
async def me(current_user=Depends(get_current_user)):
    return UserRead.model_validate(current_user)


@router.patch("/me/password")
async def change_password_endpoint(
    payload: ChangePasswordRequest,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await change_password(str(current_user.id), payload.current_password, payload.new_password, session)
    return {"message": "Password changed successfully"}

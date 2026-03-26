from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenPair
from app.core.security import hash_password, verify_password, create_token, decode_token
from app.core.config import get_settings
from app.services.email import send_welcome_email

settings = get_settings()


async def register(payload: RegisterRequest, session: AsyncSession) -> TokenPair:
    existing = await session.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    existing_username = await session.execute(select(User).where(User.username == payload.username))
    if existing_username.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")

    user = User(email=payload.email, username=payload.username, password_hash=hash_password(payload.password))
    session.add(user)
    await session.commit()
    await session.refresh(user)

    # Send welcome email (non-blocking, don't fail if email fails)
    try:
        await send_welcome_email(user.email, payload.username)
    except Exception as e:
        print(f"Warning: Email send failed but user signup succeeded: {str(e)}")

    access = create_token(str(user.id), settings.access_token_expire_minutes)
    refresh = create_token(str(user.id), settings.refresh_token_expire_minutes)
    return TokenPair(access_token=access, refresh_token=refresh)


async def login(payload: LoginRequest, session: AsyncSession) -> TokenPair:
    stmt = select(User).where((User.email == payload.email_or_username) | (User.username == payload.email_or_username))
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access = create_token(str(user.id), settings.access_token_expire_minutes)
    refresh = create_token(str(user.id), settings.refresh_token_expire_minutes)
    return TokenPair(access_token=access, refresh_token=refresh)


async def refresh_auth_token(refresh_token: str) -> TokenPair:
    """Generate new access token using refresh token"""
    try:
        payload = decode_token(refresh_token)
        if not payload:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        
        # Create new access token
        new_access = create_token(user_id, settings.access_token_expire_minutes)
        # Keep the same refresh token
        return TokenPair(access_token=new_access, refresh_token=refresh_token)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token refresh failed")

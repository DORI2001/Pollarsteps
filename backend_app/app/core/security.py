from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Dict
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.config import get_settings

# Configure passlib to avoid bcrypt wrap bug detection issues
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
    bcrypt__ident="2b"
)
settings = get_settings()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_token(subject: str, expires_minutes: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode: dict = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None

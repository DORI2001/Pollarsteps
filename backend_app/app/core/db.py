from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import StaticPool
from typing import AsyncGenerator
from app.core.config import get_settings


settings = get_settings()

# Create async engine
engine = create_async_engine(
    str(settings.database_url),
    echo=False,  # Disable SQL debug logging
    future=True,
    connect_args={
        "check_same_thread": False,
        "timeout": 30,
    },
    poolclass=StaticPool if "sqlite" in str(settings.database_url) else None,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=True,  # Force expiration on commit to refresh from DB
    class_=AsyncSession,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

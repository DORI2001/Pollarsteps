import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.main import app
from app.core.db import Base, get_db
from uuid import uuid4


# Test database setup
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def test_session(test_engine):
    async_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session


@pytest.fixture
async def client(test_session):
    async def override_get_db():
        yield test_session
    
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_health_endpoint(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_register_user(client):
    response = await client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "secure123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    await client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "username": "user1",
            "password": "secure123"
        }
    )
    response = await client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "username": "user2",
            "password": "secure123"
        }
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_login_user(client):
    await client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "secure123"
        }
    )
    response = await client.post(
        "/auth/login",
        json={
            "email_or_username": "testuser",
            "password": "secure123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_login_invalid_credentials(client):
    response = await client.post(
        "/auth/login",
        json={
            "email_or_username": "nonexistent",
            "password": "wrong"
        }
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_trip(client):
    # Register user
    reg_response = await client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "secure123"
        }
    )
    token = reg_response.json()["access_token"]
    
    # Create trip
    response = await client.post(
        "/trips/",
        json={
            "title": "Europe Adventure",
            "description": "Summer 2026",
            "start_date": "2026-06-01",
            "is_public": False
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Europe Adventure"
    assert "id" in data


@pytest.mark.asyncio
async def test_add_step_idempotent(client):
    # Register user
    reg_response = await client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "secure123"
        }
    )
    token = reg_response.json()["access_token"]
    
    # Create trip
    trip_response = await client.post(
        "/trips/",
        json={
            "title": "Europe Adventure",
            "description": "Summer 2026",
            "is_public": False
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    trip_id = trip_response.json()["id"]
    
    # Add step with client_uuid
    client_uuid = str(uuid4())
    response = await client.post(
        "/steps/",
        json={
            "trip_id": trip_id,
            "lat": 48.8566,
            "lng": 2.3522,
            "altitude": 35,
            "timestamp": "2026-03-20T12:00:00Z",
            "note": "Eiffel Tower",
            "client_uuid": client_uuid
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    first_response = response.json()
    
    # Add same step again (should be idempotent)
    response2 = await client.post(
        "/steps/",
        json={
            "trip_id": trip_id,
            "lat": 48.8566,
            "lng": 2.3522,
            "altitude": 35,
            "timestamp": "2026-03-20T12:00:00Z",
            "note": "Eiffel Tower",
            "client_uuid": client_uuid
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    second_response = response2.json()
    assert first_response["id"] == second_response["id"]

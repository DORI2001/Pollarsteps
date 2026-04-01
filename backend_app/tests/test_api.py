import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.main import app
from app.core.db import Base
from app.api.deps import get_db
from uuid import uuid4

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture()
async def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture()
async def client(test_engine):
    factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# ── helpers ────────────────────────────────────────────────────────────────────

async def _register(client, tag=None):
    tag = tag or str(uuid4())[:8]
    r = await client.post("/api/auth/register", json={
        "email": f"{tag}@test.com", "username": tag, "password": "Password1",
    })
    return r.json()["access_token"], tag


async def _create_trip(client, token, title="Trip"):
    r = await client.post("/api/trips/", json={"title": title},
                          headers={"Authorization": f"Bearer {token}"})
    return r.json()


async def _create_step(client, token, trip_id, lat=1.0, lng=1.0):
    r = await client.post("/api/steps/", json={
        "trip_id": trip_id, "lat": lat, "lng": lng,
        "client_uuid": str(uuid4()),
    }, headers={"Authorization": f"Bearer {token}"})
    return r.json()


# ── health ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200


# ── auth ───────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_success(client):
    r = await client.post("/api/auth/register", json={
        "email": "a@test.com", "username": "auser", "password": "Password1",
    })
    assert r.status_code == 200
    assert "access_token" in r.json()


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    await client.post("/api/auth/register", json={
        "email": "dup@test.com", "username": "u1", "password": "Password1",
    })
    r = await client.post("/api/auth/register", json={
        "email": "dup@test.com", "username": "u2", "password": "Password1",
    })
    assert r.status_code in (400, 409)


@pytest.mark.asyncio
async def test_login_success(client):
    await client.post("/api/auth/register", json={
        "email": "b@test.com", "username": "buser", "password": "Password1",
    })
    r = await client.post("/api/auth/login", json={
        "email_or_username": "buser", "password": "Password1",
    })
    assert r.status_code == 200
    assert "access_token" in r.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/api/auth/register", json={
        "email": "c@test.com", "username": "cuser", "password": "Password1",
    })
    r = await client.post("/api/auth/login", json={
        "email_or_username": "cuser", "password": "Wrong",
    })
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client):
    token, _ = await _register(client)
    r = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert "email" in r.json()


# ── trips ──────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_trip(client):
    token, _ = await _register(client)
    r = await client.post("/api/trips/", json={"title": "Japan 2026"},
                          headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 201
    assert r.json()["title"] == "Japan 2026"


@pytest.mark.asyncio
async def test_list_trips_pagination(client):
    token, _ = await _register(client)
    for i in range(5):
        await _create_trip(client, token, f"Trip {i}")
    r = await client.get("/api/trips/?skip=0&limit=3",
                         headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert len(r.json()) == 3


@pytest.mark.asyncio
async def test_get_trip(client):
    token, _ = await _register(client)
    trip = await _create_trip(client, token)
    r = await client.get(f"/api/trips/{trip['id']}",
                         headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_update_trip(client):
    token, _ = await _register(client)
    trip = await _create_trip(client, token, "Old")
    r = await client.patch(f"/api/trips/{trip['id']}", json={"title": "New"},
                           headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["title"] == "New"


@pytest.mark.asyncio
async def test_delete_trip(client):
    token, _ = await _register(client)
    trip = await _create_trip(client, token)
    r = await client.delete(f"/api/trips/{trip['id']}",
                            headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    trips = await client.get("/api/trips/", headers={"Authorization": f"Bearer {token}"})
    assert all(t["id"] != trip["id"] for t in trips.json())


@pytest.mark.asyncio
async def test_trip_forbidden_other_user(client):
    token_a, _ = await _register(client)
    token_b, _ = await _register(client)
    trip = await _create_trip(client, token_a)
    r = await client.get(f"/api/trips/{trip['id']}",
                         headers={"Authorization": f"Bearer {token_b}"})
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_share_and_view_trip(client):
    token, _ = await _register(client)
    trip = await _create_trip(client, token)
    share = await client.post(f"/api/trips/{trip['id']}/share",
                              headers={"Authorization": f"Bearer {token}"})
    assert share.status_code == 200
    share_token = share.json()["share_token"]
    pub = await client.get(f"/api/trips/shared/{share_token}")
    assert pub.status_code == 200
    assert pub.json()["title"] == trip["title"]


# ── steps ──────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_step(client):
    token, _ = await _register(client)
    trip = await _create_trip(client, token)
    step = await _create_step(client, token, trip["id"], lat=48.85, lng=2.35)
    assert step["lat"] == 48.85


@pytest.mark.asyncio
async def test_list_steps(client):
    token, _ = await _register(client)
    trip = await _create_trip(client, token)
    for i in range(3):
        await _create_step(client, token, trip["id"], lat=float(i), lng=float(i))
    r = await client.get(f"/api/steps/trip/{trip['id']}",
                         headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert len(r.json()["steps"]) == 3


@pytest.mark.asyncio
async def test_step_idempotent_client_uuid(client):
    token, _ = await _register(client)
    trip = await _create_trip(client, token)
    cuuid = str(uuid4())
    payload = {"trip_id": trip["id"], "lat": 1.0, "lng": 1.0, "client_uuid": cuuid}
    r1 = await client.post("/api/steps/", json=payload,
                           headers={"Authorization": f"Bearer {token}"})
    r2 = await client.post("/api/steps/", json=payload,
                           headers={"Authorization": f"Bearer {token}"})
    assert r1.json()["id"] == r2.json()["id"]


@pytest.mark.asyncio
async def test_update_step(client):
    token, _ = await _register(client)
    trip = await _create_trip(client, token)
    step = await _create_step(client, token, trip["id"])
    r = await client.put(f"/api/steps/{step['id']}", json={"note": "updated"},
                         headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["note"] == "updated"


@pytest.mark.asyncio
async def test_delete_step(client):
    token, _ = await _register(client)
    trip = await _create_trip(client, token)
    step = await _create_step(client, token, trip["id"])
    r = await client.delete(f"/api/steps/{step['id']}",
                            headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200


# ── collaboration ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_invite_and_list_collaborator(client):
    token_owner, _ = await _register(client)
    _, guest_tag = await _register(client)
    trip = await _create_trip(client, token_owner)

    r = await client.post(f"/api/trips/{trip['id']}/collaborators",
                          json={"username": guest_tag, "role": "viewer"},
                          headers={"Authorization": f"Bearer {token_owner}"})
    assert r.status_code == 201
    assert r.json()["username"] == guest_tag

    list_r = await client.get(f"/api/trips/{trip['id']}/collaborators",
                              headers={"Authorization": f"Bearer {token_owner}"})
    assert list_r.status_code == 200
    assert len(list_r.json()) == 1


@pytest.mark.asyncio
async def test_remove_collaborator(client):
    token_owner, _ = await _register(client)
    token_guest, guest_tag = await _register(client)
    trip = await _create_trip(client, token_owner)

    invite = await client.post(f"/api/trips/{trip['id']}/collaborators",
                               json={"username": guest_tag, "role": "viewer"},
                               headers={"Authorization": f"Bearer {token_owner}"})
    collab_user_id = invite.json()["user_id"]

    r = await client.delete(
        f"/api/trips/{trip['id']}/collaborators/{collab_user_id}",
        headers={"Authorization": f"Bearer {token_owner}"},
    )
    assert r.status_code == 204

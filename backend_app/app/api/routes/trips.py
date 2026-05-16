from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.api.deps import get_db, get_current_user
from app.schemas.trip import TripCreate, TripWithSteps, TripRead, TripUpdate, TripSplitRequest, TripSplitResponse
from app.services import trips as trip_service
from app.models.collaborator import CollaboratorRole
from app.utils.errors import NotFoundError, AppException
from pydantic import BaseModel as PydanticBaseModel

router = APIRouter(prefix="/trips", tags=["trips"])


@router.post("/", response_model=TripRead, status_code=status.HTTP_201_CREATED)
async def create_trip(payload: TripCreate, session: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    trip = await trip_service.create_trip(current_user.id, payload, session)
    return TripRead.model_validate(trip)


@router.get("/", response_model=list[TripRead])
async def get_trips(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    trips = await trip_service.get_user_trips(current_user.id, session, skip=skip, limit=limit)
    return [TripRead.model_validate(trip) for trip in trips]


@router.get("/{trip_id}", response_model=TripWithSteps)
async def get_trip(trip_id: UUID, session: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    data = await trip_service.get_trip_with_steps(trip_id, session)
    if not data:
        raise NotFoundError("Trip")
    check_ownership(data.user_id, current_user.id, "Trip")
    return data


@router.patch("/{trip_id}", response_model=TripRead)
async def update_trip(trip_id: UUID, payload: TripUpdate, session: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    trip = await trip_service.update_trip(trip_id, current_user.id, payload, session)
    return TripRead.model_validate(trip)


@router.delete("/{trip_id}")
async def delete_trip(trip_id: UUID, session: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await trip_service.delete_trip(trip_id, session, current_user)
    if not result:
        raise NotFoundError("Trip")
    return result


@router.post("/{trip_id}/split", response_model=TripSplitResponse)
async def split_trip(
    trip_id: UUID,
    payload: TripSplitRequest,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Split a trip by moving specified steps into a new trip."""
    try:
        original, new = await trip_service.split_trip(
            trip_id, current_user.id, payload.new_trip_title, payload.step_ids, session
        )
        return TripSplitResponse(
            original_trip=TripRead.model_validate(original),
            new_trip=TripRead.model_validate(new),
        )
    except ValueError as e:
        raise AppException(detail=str(e))


@router.post("/{trip_id}/share")
async def generate_share_link(trip_id: UUID, session: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await trip_service.generate_share_link(str(trip_id), str(current_user.id), session)


@router.delete("/{trip_id}/share")
async def revoke_share_link(trip_id: UUID, session: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    await trip_service.revoke_share_link(str(trip_id), str(current_user.id), session)
    return {"message": "Share link revoked"}


@router.get("/shared/{share_token}", response_model=TripWithSteps)
async def get_shared_trip(share_token: str, session: AsyncSession = Depends(get_db)):
    from sqlalchemy import select as sa_select
    from app.models.trip import Trip
    result = await session.execute(
        sa_select(Trip).where(Trip.share_token == share_token, Trip.is_public == True)
    )
    trip = result.scalar_one_or_none()
    if not trip:
        raise NotFoundError("Shared trip")
    trip_data = await trip_service.get_trip_with_steps(trip.id, session)
    if not trip_data:
        raise NotFoundError("Trip")
    return trip_data


# ── Collaboration ──────────────────────────────────────────────────────────────

class CollaboratorInvite(PydanticBaseModel):
    username: str
    role: CollaboratorRole = CollaboratorRole.viewer


class CollaboratorOut(PydanticBaseModel):
    id: UUID
    user_id: UUID
    username: str
    role: CollaboratorRole

    class Config:
        from_attributes = True


@router.post("/{trip_id}/collaborators", response_model=CollaboratorOut, status_code=201)
async def invite_collaborator(
    trip_id: UUID,
    payload: CollaboratorInvite,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    rec = await trip_service.invite_collaborator(str(trip_id), str(current_user.id), payload.username, payload.role, session)
    return CollaboratorOut(id=rec.id, user_id=rec.user_id, username=rec.username, role=rec.role)


@router.get("/{trip_id}/collaborators", response_model=list[CollaboratorOut])
async def list_collaborators(
    trip_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    recs = await trip_service.list_collaborators(str(trip_id), str(current_user.id), session)
    return [CollaboratorOut(id=r.id, user_id=r.user_id, username=r.username, role=r.role) for r in recs]


@router.delete("/{trip_id}/collaborators/{user_id}", status_code=204)
async def remove_collaborator(
    trip_id: UUID,
    user_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await trip_service.remove_collaborator(str(trip_id), str(current_user.id), str(user_id), session)
    await session.commit()

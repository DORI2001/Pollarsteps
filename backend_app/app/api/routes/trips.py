from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import secrets
from app.api.deps import get_db, get_current_user
from app.schemas.trip import TripCreate, TripWithSteps, TripRead, TripUpdate, TripSplitRequest, TripSplitResponse
from app.services import trips as trip_service
from app.models.trip import Trip
from app.models.user import User
from app.models.collaborator import TripCollaborator, CollaboratorRole
from app.utils.errors import NotFoundError, check_ownership
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found or you don't have permission")
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
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{trip_id}/share")
async def generate_share_link(trip_id: UUID, session: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    """Generate a shareable link for a trip."""
    result = await session.execute(select(Trip).where(Trip.id == str(trip_id)))
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")

    # Generate token if not already set
    if not trip.share_token:
        trip.share_token = secrets.token_urlsafe(32)
        trip.is_public = True
        await session.commit()
        await session.refresh(trip)

    return {"share_token": trip.share_token, "share_url": f"/shared/{trip.share_token}"}


@router.delete("/{trip_id}/share")
async def revoke_share_link(trip_id: UUID, session: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    """Revoke a share link for a trip."""
    result = await session.execute(select(Trip).where(Trip.id == str(trip_id)))
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")

    trip.share_token = None
    trip.is_public = False
    await session.commit()
    return {"message": "Share link revoked"}


@router.get("/shared/{share_token}", response_model=TripWithSteps)
async def get_shared_trip(share_token: str, session: AsyncSession = Depends(get_db)):
    """View a shared trip (no auth required)."""
    result = await session.execute(
        select(Trip).where(Trip.share_token == share_token, Trip.is_public == True)
    )
    trip = result.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Shared trip not found or link expired")

    # Load steps
    from app.services.trips import get_trip_with_steps
    trip_data = await get_trip_with_steps(trip.id, session)
    if not trip_data:
        raise HTTPException(status_code=404, detail="Trip not found")
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
    """Invite a user to collaborate on a trip."""
    trip_result = await session.execute(select(Trip).where(Trip.id == str(trip_id)))
    trip = trip_result.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Only the trip owner can invite collaborators")

    user_result = await session.execute(select(User).where(User.username == payload.username))
    invited_user = user_result.scalar_one_or_none()
    if not invited_user:
        raise HTTPException(status_code=404, detail=f"User '{payload.username}' not found")
    if invited_user.id == str(current_user.id):
        raise HTTPException(status_code=400, detail="Cannot invite yourself")

    existing = await session.execute(
        select(TripCollaborator).where(
            TripCollaborator.trip_id == str(trip_id),
            TripCollaborator.user_id == invited_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="User is already a collaborator")

    collab = TripCollaborator(trip_id=str(trip_id), user_id=invited_user.id, role=payload.role)
    session.add(collab)
    await session.commit()
    await session.refresh(collab)

    return CollaboratorOut(
        id=collab.id,
        user_id=invited_user.id,
        username=invited_user.username,
        role=collab.role,
    )


@router.get("/{trip_id}/collaborators", response_model=list[CollaboratorOut])
async def list_collaborators(
    trip_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List collaborators on a trip."""
    trip_result = await session.execute(select(Trip).where(Trip.id == str(trip_id)))
    trip = trip_result.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")

    result = await session.execute(
        select(TripCollaborator, User)
        .join(User, TripCollaborator.user_id == User.id)
        .where(TripCollaborator.trip_id == str(trip_id))
    )
    rows = result.all()
    return [CollaboratorOut(id=c.id, user_id=c.user_id, username=u.username, role=c.role) for c, u in rows]


@router.delete("/{trip_id}/collaborators/{user_id}", status_code=204)
async def remove_collaborator(
    trip_id: UUID,
    user_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Remove a collaborator from a trip."""
    trip_result = await session.execute(select(Trip).where(Trip.id == str(trip_id)))
    trip = trip_result.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Only the trip owner can remove collaborators")

    result = await session.execute(
        select(TripCollaborator).where(
            TripCollaborator.trip_id == str(trip_id),
            TripCollaborator.user_id == str(user_id),
        )
    )
    collab = result.scalar_one_or_none()
    if not collab:
        raise HTTPException(status_code=404, detail="Collaborator not found")
    await session.delete(collab)
    await session.commit()

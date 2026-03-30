from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import secrets
from app.api.deps import get_db, get_current_user
from app.schemas.trip import TripCreate, TripWithSteps, TripRead
from app.services import trips as trip_service
from app.models.trip import Trip
from app.utils.errors import NotFoundError, check_ownership

router = APIRouter(prefix="/trips", tags=["trips"])


@router.post("/", response_model=TripRead, status_code=status.HTTP_201_CREATED)
async def create_trip(payload: TripCreate, session: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    trip = await trip_service.create_trip(current_user.id, payload, session)
    return TripRead.model_validate(trip)


@router.get("/", response_model=list[TripRead])
async def get_trips(session: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    trips = await trip_service.get_user_trips(current_user.id, session)
    return [TripRead.model_validate(trip) for trip in trips]


@router.get("/{trip_id}", response_model=TripWithSteps)
async def get_trip(trip_id: UUID, session: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    data = await trip_service.get_trip_with_steps(trip_id, session)
    if not data:
        raise NotFoundError("Trip")
    check_ownership(data.user_id, current_user.id, "Trip")
    return data


@router.delete("/{trip_id}")
async def delete_trip(trip_id: UUID, session: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await trip_service.delete_trip(trip_id, session, current_user)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found or you don't have permission")
    return result


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

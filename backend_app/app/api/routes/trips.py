from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.api.deps import get_db, get_current_user
from app.schemas.trip import TripCreate, TripWithSteps, TripRead
from app.services import trips as trip_service

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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    if data.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return data


@router.delete("/{trip_id}")
async def delete_trip(trip_id: UUID, session: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await trip_service.delete_trip(trip_id, session, current_user)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found or you don't have permission")
    return result

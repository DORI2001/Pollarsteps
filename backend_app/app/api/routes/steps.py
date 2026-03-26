from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.api.deps import get_db, get_current_user
from app.schemas.step import StepCreate, StepRead, StepUpdate
from app.services.steps import add_step, update_step, delete_step
from app.services.trips import get_trip_with_steps

router = APIRouter(prefix="/steps", tags=["steps"])


@router.post("/", response_model=StepRead, status_code=status.HTTP_201_CREATED)
async def create_step(payload: StepCreate, session: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await add_step(payload.trip_id, payload, session)


@router.put("/{step_id}", response_model=StepRead)
async def update_step_endpoint(step_id: UUID, payload: StepUpdate, session: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await update_step(step_id, payload, session, current_user)


@router.delete("/{step_id}")
async def delete_step_endpoint(step_id: UUID, session: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await delete_step(step_id, session, current_user)


@router.get("/trip/{trip_id}")
async def list_steps(trip_id: UUID, session: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    data = await get_trip_with_steps(trip_id, session)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    # Compare user IDs as strings since both are stored as VARCHAR(36) in database
    if str(data.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return data

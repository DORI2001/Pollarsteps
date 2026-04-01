from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.api.deps import get_db, get_current_user
from app.schemas.step import StepCreate, StepRead, StepUpdate, StepImageRead
from app.services.steps import add_step, update_step, delete_step
from app.services.trips import get_trip_with_steps
from app.models.step import Step
from app.models.step_image import StepImage
from app.models.trip import Trip

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


@router.post("/{step_id}/images", response_model=StepImageRead, status_code=status.HTTP_201_CREATED)
async def add_step_image(
    step_id: UUID,
    image_url: str,
    caption: str = None,
    session: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Add a photo to a step."""
    step = await session.get(Step, str(step_id))
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    trip = await session.get(Trip, step.trip_id)
    if not trip or str(trip.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
    # Get max order index
    result = await session.execute(
        select(StepImage).where(StepImage.step_id == str(step_id)).order_by(StepImage.order_index.desc())
    )
    last = result.scalars().first()
    new_order = (last.order_index + 1) if last else 0
    img = StepImage(step_id=str(step_id), image_url=image_url, caption=caption, order_index=new_order)
    session.add(img)
    await session.commit()
    await session.refresh(img)
    return StepImageRead.model_validate(img)

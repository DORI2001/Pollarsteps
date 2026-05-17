from datetime import datetime, timezone
from uuid import UUID
from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from app.models.step import Step
from app.models.step_image import StepImage
from app.models.trip import Trip
from app.schemas.step import StepCreate, StepRead, StepUpdate, StepImageRead


async def add_step(trip_id: UUID, payload: StepCreate, session: AsyncSession, owner_id: Optional[str] = None) -> StepRead:
    # Convert UUID to string for SQLite compatibility
    trip_id_str = str(trip_id)
    trip = await session.get(Trip, trip_id_str)
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    if owner_id is not None and str(trip.user_id) != owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    # Idempotent check by client_uuid
    existing = await session.execute(
        select(Step).where(Step.trip_id == trip_id_str, Step.client_uuid == str(payload.client_uuid))
        .options(selectinload(Step.images))
    )
    step = existing.scalar_one_or_none()
    if step:
        return StepRead.model_validate(step)

    # Duplicate proximity check: reject if another step is within ~100m (0.001 degrees)
    PROXIMITY = 0.001
    nearby = await session.execute(
        select(Step).where(
            Step.trip_id == trip_id_str,
            Step.lat.between(payload.lat - PROXIMITY, payload.lat + PROXIMITY),
            Step.lng.between(payload.lng - PROXIMITY, payload.lng + PROXIMITY),
        )
    )
    if nearby.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A step already exists very close to this location on this trip",
        )

    ts = payload.timestamp or datetime.now(timezone.utc)
    step = Step(
        trip_id=trip_id_str,
        lat=payload.lat,
        lng=payload.lng,
        altitude=payload.altitude,
        timestamp=ts,
        note=payload.note,
        image_url=payload.image_url,
        location_name=payload.location_name,
        client_uuid=str(payload.client_uuid),
        duration_days=payload.duration_days,
    )
    session.add(step)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        # Concurrent insert with same client_uuid — re-fetch and return the winner
        existing = await session.execute(
            select(Step).where(Step.trip_id == trip_id_str, Step.client_uuid == str(payload.client_uuid))
            .options(selectinload(Step.images))
        )
        step = existing.scalar_one_or_none()
        if step:
            return StepRead.model_validate(step)
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Step already exists")
    await session.refresh(step)
    # New step always has zero images — build read model directly to avoid lazy-load
    from app.schemas.step import StepImageRead
    return StepRead(
        id=step.id,
        trip_id=step.trip_id,
        lat=step.lat,
        lng=step.lng,
        altitude=step.altitude,
        timestamp=step.timestamp,
        note=step.note,
        image_url=step.image_url,
        location_name=step.location_name,
        client_uuid=step.client_uuid,
        duration_days=step.duration_days,
        images=[],
    )


async def update_step(step_id: UUID, payload: StepUpdate, session: AsyncSession, current_user) -> StepRead:
    step_id_str = str(step_id)
    step = await session.get(Step, step_id_str)
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")
    
    # Verify ownership through trip
    trip = await session.get(Trip, step.trip_id)
    if not trip or trip.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    
    # Update fields
    if payload.location_name is not None:
        step.location_name = payload.location_name
    if payload.note is not None:
        step.note = payload.note
    if payload.duration_days is not None:
        step.duration_days = payload.duration_days
    
    await session.commit()
    result = await session.execute(
        select(Step).where(Step.id == step_id_str).options(selectinload(Step.images))
    )
    step = result.scalar_one()
    from app.schemas.step import StepImageRead
    return StepRead(
        id=step.id,
        trip_id=step.trip_id,
        lat=step.lat,
        lng=step.lng,
        altitude=step.altitude,
        timestamp=step.timestamp,
        note=step.note,
        image_url=step.image_url,
        location_name=step.location_name,
        client_uuid=step.client_uuid,
        duration_days=step.duration_days,
        images=[StepImageRead(id=img.id, image_url=img.image_url, caption=img.caption, order_index=img.order_index) for img in step.images],
    )


async def add_step_image(step_id: UUID, image_url: str, caption: Optional[str], owner_id: str, session: AsyncSession) -> StepImageRead:
    step = await session.get(Step, str(step_id))
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    trip = await session.get(Trip, step.trip_id)
    if not trip or str(trip.user_id) != owner_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    result = await session.execute(
        select(StepImage).where(StepImage.step_id == str(step_id)).order_by(StepImage.order_index.desc())
    )
    last = result.scalars().first()
    new_order = (last.order_index + 1) if last else 0
    img = StepImage(step_id=str(step_id), image_url=image_url, caption=caption, order_index=new_order)
    session.add(img)
    await session.commit()
    await session.refresh(img)
    return StepImageRead(id=img.id, image_url=img.image_url, caption=img.caption, order_index=img.order_index)


async def delete_step(step_id: UUID, session: AsyncSession, current_user) -> dict:
    step_id_str = str(step_id)
    step = await session.get(Step, step_id_str)
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")
    
    # Verify ownership through trip
    trip = await session.get(Trip, step.trip_id)
    if not trip or str(trip.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    
    await session.delete(step)
    await session.commit()
    return {"message": "Step deleted successfully"}

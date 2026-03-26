#!/usr/bin/env python3
import asyncio
import sys
sys.path.insert(0, 'backend_app')

from app.core.db import SessionLocal
from app.models.trip import Trip
from app.models.step import Step
from sqlalchemy import select

async def test():
    async with SessionLocal() as session:
        # Get latest trip
        result = await session.execute(select(Trip).order_by(Trip.created_at.desc()).limit(1))
        trip = result.scalar_one_or_none()
        
        if trip:
            print(f"Trip ID: {trip.id} (type: {type(trip.id).__name__})")
            print(f"Trip title: {trip.title}")
            
            # Query steps for this trip
            result2 = await session.execute(select(Step).where(Step.trip_id == trip.id).order_by(Step.timestamp.asc()))
            steps = result2.scalars().all()
            print(f"Steps found: {len(steps)}")
            
            if steps:
                for i, step in enumerate(steps[:3]):
                    print(f"  Step {i}: trip_id={step.trip_id} (type: {type(step.trip_id).__name__}), location={step.location_name}")
        else:
            print("No trips found")

asyncio.run(test())

#!/usr/bin/env python3
import asyncio
import sys
sys.path.insert(0, 'backend_app')

from app.core.db import SessionLocal
from app.models.step import Step
from sqlalchemy import select

async def test():
    # Test trip ID that we know has data
    trip_id = "1e1915a1-7abc-45db-8c4d-5a2d7b960973"
    
    async with SessionLocal() as session:
        # Query 1: Raw SQL-like count
        result = await session.execute(select(Step).where(Step.trip_id == trip_id))
        steps = result.scalars().all()
        print(f"Query with string comparison: Found {len(steps)} steps")
        
        if steps:
            for step in steps:
                print(f"  - {step.location_name} ({step.id})")
        else:
            # Try another approach
            from sqlalchemy import text
            result2 = await session.execute(text(f"SELECT COUNT(*) FROM steps WHERE trip_id = '{trip_id}'"))
            count = result2.scalar()
            print(f"Raw SQL count: {count} steps")

asyncio.run(test())

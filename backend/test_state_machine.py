import asyncio
from datetime import date
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal
from app.models.booking import Booking, BookingItem, ResourceRequest, BookingStatus
from app.models.resource import Resource, ResourceAvailability
from app.models.user import Business
from app.api.bookings import check_and_reserve_inventory

async def test_inventory_deduction_and_conflict():
    async with AsyncSessionLocal() as db:
        # Find a test resource
        stmt = select(Resource).where(Resource.available_quantity > 0)
        res = (await db.execute(stmt)).scalars().first()
        if not res:
            print("No active resource found to test")
            return

        initial_qty = res.available_quantity
        print(f"Testing Resource ID {res.id}: Initial available quantity = {initial_qty}")

        test_date = date(2026, 10, 15)
        # 1. First reservation of 10 items
        try:
            await check_and_reserve_inventory(
                db=db,
                resource_id=res.id,
                quantity=10,
                booking_date=test_date,
                seeker_name="Test Seeker A"
            )
            await db.commit()
            print(f"Reservation A (10 units) succeeded! Remaining = {res.available_quantity}")
        except Exception as e:
            print("Reservation A failed:", str(e))
            return

        # 2. Try to reserve more than available (res.available_quantity + 10)
        excess_qty = res.available_quantity + 10
        print(f"Attempting conflicting Reservation B for {excess_qty} units...")
        try:
            await check_and_reserve_inventory(
                db=db,
                resource_id=res.id,
                quantity=excess_qty,
                booking_date=test_date,
                seeker_name="Test Seeker B"
            )
            print("ERROR: Reservation B should have failed with conflict!")
        except Exception as e:
            await db.rollback()
            print("SUCCESS: Reservation B caught conflict properly!")
            print("Caught message:", getattr(e, "detail", str(e)))

        # Clean up: restore the 10 units
        res.available_quantity = initial_qty
        # remove test calendar records
        stmt_del = select(ResourceAvailability).where(
            ResourceAvailability.resource_id == res.id,
            ResourceAvailability.date == test_date
        )
        del_records = (await db.execute(stmt_del)).scalars().all()
        for r in del_records:
            await db.delete(r)
        await db.commit()
        print("Test cleanup completed.")

if __name__ == '__main__':
    asyncio.run(test_inventory_deduction_and_conflict())

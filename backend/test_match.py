import asyncio
from app.database import AsyncSessionLocal
from app.services.matching_service import generate_matches_for_requirement
from app.models.requirement import Requirement
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

async def main():
    async with AsyncSessionLocal() as db:
        req = (await db.execute(
            select(Requirement)
            .options(selectinload(Requirement.items))
            .where(Requirement.id == 22)
        )).scalar_one_or_none()
        
        if req:
            print("Found requirement:", req.title)
            print("Requested items:", [(i.resource_type, i.quantity) for i in req.items])
            res = await generate_matches_for_requirement(db, req)
            singles = res.get("single_matches", [])
            pools = res.get("pooled_solutions", [])
            
            print(f"\n--- SINGLE MATCHES ({len(singles)}) ---")
            for s in singles:
                print(f"  Single Match: {s['provider_names']} -> Total Cost: INR {s['total_cost']}")
                assert len(s["provider_names"]) == 1
                assert s["match_type"] == "SINGLE"
                
            print(f"\n--- POOLED SOLUTIONS ({len(pools)}) ---")
            seen_combos = set()
            for p in pools:
                print(f"  Pooled Match: {len(p['provider_names'])} providers: {p['provider_names']} -> Total Cost: INR {p['total_cost']}")
                # Verify size >= 2
                assert len(p["provider_names"]) >= 2, f"Pool has size {len(p['provider_names'])}, must be >= 2"
                assert p["match_type"] == "POOLED"
                combo_key = tuple(sorted(p["provider_names"]))
                assert combo_key not in seen_combos, f"Duplicate pool found: {combo_key}"
                seen_combos.add(combo_key)
                
            print("\nALL BACKEND VALIDATIONS PASSED: Strictly separated, no size-1 pools, no duplicates!")
        else:
            print("Req 22 not found")

if __name__ == "__main__":
    asyncio.run(main())

import asyncio
import httpx
from app.main import app

async def test_phase4_5():
    print("Testing Phase 4 & Phase 5: Matching & Pooling Engine...")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Seed database
        await client.post("/api/seed")

        # 2. Login as Seeker (Apex Events)
        res_login = await client.post("/api/auth/login", json={
            "email": "seeker@apexevents.com",
            "password": "Password123!"
        })
        assert res_login.status_code == 200
        token = res_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Create requirement: 200 chairs & 20 tables for wedding in Thane
        req_payload = {
            "title": "Need 200 chairs and 20 tables for wedding in Thane",
            "event_type": "wedding",
            "location_city": "Thane",
            "event_date": "2026-09-28",
            "start_time": "17:00",
            "end_time": "23:00",
            "budget": 15000.0,
            "delivery_required": True,
            "items": [
                {"resource_type": "chairs", "quantity": 200},
                {"resource_type": "tables", "quantity": 20}
            ]
        }
        res_create = await client.post("/api/requirements", json=req_payload, headers=headers)
        assert res_create.status_code == 201
        req_id = res_create.json()["id"]

        # 4. Fetch matches
        res_matches = await client.get(f"/api/requirements/{req_id}/matches", headers=headers)
        assert res_matches.status_code == 200, res_matches.text
        matches = res_matches.json()
        print(f"Total matching solutions generated: {len(matches)}")

        single_matches = [m for m in matches if m["match_type"] == "SINGLE"]
        pooled_matches = [m for m in matches if m["match_type"] == "POOLED"]

        print(f"Single provider matches: {len(single_matches)}")
        print(f"Pooled multi-provider solutions: {len(pooled_matches)}")

        # Verify pooling found combinations
        assert len(pooled_matches) > 0, "Pooling algorithm should generate multi-provider combinations!"

        # Print top match details
        top_match = matches[0]
        print("\n--- TOP RANKED MATCH ---")
        print("Type:", top_match["match_type"])
        print("Overall Score:", top_match["overall_score"], "/ 100")
        print("Total Cost: INR", top_match["total_cost"])
        print("Full Coverage:", top_match["is_full_coverage"])
        print("Participating Providers:", top_match["provider_names"])
        print("Why this match?")
        for exp in top_match["explanation"]:
            print("  *", exp.replace("\u20b9", "INR "))


        # Verify score breakdown exists
        assert "availability_score" in top_match
        assert "quantity_score" in top_match
        assert "distance_score" in top_match
        assert "price_score" in top_match
        assert "compatibility_score" in top_match
        assert "trust_score" in top_match

    print("\n PHASE 4 & PHASE 5 VERIFICATION PASSED SUCCESSFULLY! \n")

if __name__ == "__main__":
    asyncio.run(test_phase4_5())

import asyncio
import httpx
from app.main import app

async def test_phase2():
    print("Testing Phase 2: Provider Dashboard API...")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Seed first
        await client.post("/api/seed")

        # Login as Royal Banquets
        res_login = await client.post("/api/auth/login", json={
            "email": "provider1@royalbanquets.com",
            "password": "Password123!"
        })
        assert res_login.status_code == 200
        token = res_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Fetch current inventory
        res_inv = await client.get("/api/resources/my-inventory", headers=headers)
        assert res_inv.status_code == 200
        items = res_inv.json()
        print(f"Provider has {len(items)} resources in inventory.")
        assert len(items) >= 3

        # 2. Create new resource (Linen)
        new_res_payload = {
            "name": "Luxury Maroon Chair Covers",
            "category": "Linen",
            "description": "Elastic spandex chair covers with gold tie sashes.",
            "total_quantity": 120,
            "price": 15.0,
            "price_unit": "per_day",
            "minimum_rental_period": 1,
            "condition": "Excellent",
            "delivery_available": True,
            "delivery_charge": 250.0
        }
        res_create = await client.post("/api/resources", json=new_res_payload, headers=headers)
        assert res_create.status_code == 201
        created = res_create.json()
        print(f"Created resource ID {created['id']}: {created['name']} in category {created['category']}")
        assert created["available_quantity"] == 120

        # 3. Update resource
        res_update = await client.put(f"/api/resources/{created['id']}", json={
            "price": 18.0,
            "description": "Premium spandex chair covers with gold tie sashes."
        }, headers=headers)
        assert res_update.status_code == 200
        assert res_update.json()["price"] == 18.0
        print("Updated resource price successfully to 18.0")

        # 4. Block availability date
        avail_payload = {
            "date": "2026-10-15",
            "blocked_quantity": 50,
            "is_blocked": False,
            "reason": "Reserved for Corporate Banquet"
        }
        res_avail = await client.post(f"/api/resources/{created['id']}/availability", json=avail_payload, headers=headers)
        assert res_avail.status_code == 200
        print("Added availability calendar block successfully.")

        # 5. List all resources
        res_all = await client.get("/api/resources")
        assert res_all.status_code == 200
        print(f"Total active resources across platform: {len(res_all.json())}")

    print("\n PHASE 2 BACKEND VERIFICATION PASSED SUCCESSFULLY! \n")

if __name__ == "__main__":
    asyncio.run(test_phase2())

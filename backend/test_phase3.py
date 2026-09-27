import asyncio
import httpx
from app.main import app

async def test_phase3():
    print("Testing Phase 3: AI Parser and Seeker Requirement Creation...")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Seed first
        await client.post("/api/seed")

        # 1. Test POST /api/ai/parse-requirement with the exact example prompt
        prompt = "Need 200 chairs and 20 tables for a wedding in Thane tomorrow, budget 15,000"
        res_ai = await client.post("/api/ai/parse-requirement", json={"prompt": prompt})
        assert res_ai.status_code == 200, res_ai.text
        parsed = res_ai.json()
        print("AI Parser Output:", parsed)

        # Validate schema keys
        assert "items" in parsed
        assert len(parsed["items"]) == 2
        assert parsed["items"][0]["resource_type"] == "chairs" and parsed["items"][0]["quantity"] == 200
        assert parsed["items"][1]["resource_type"] == "tables" and parsed["items"][1]["quantity"] == 20
        assert parsed["location"]["city"].lower() == "thane"
        assert parsed["budget"] == 15000.0
        assert parsed["delivery_required"] is True
        assert parsed["event_type"].lower() == "wedding"
        print("AI Parser returned exact JSON structure!")

        # 2. Login as Seeker (Apex Events)
        res_login = await client.post("/api/auth/login", json={
            "email": "seeker@apexevents.com",
            "password": "Password123!"
        })
        assert res_login.status_code == 200
        token = res_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Create requirement using the parsed output (as the user confirms it)
        req_payload = {
            "title": "Wedding Requirement in Thane",
            "event_type": parsed["event_type"],
            "location_city": parsed["location"]["city"],
            "event_date": parsed["date"],
            "start_time": parsed["start_time"],
            "end_time": parsed["end_time"],
            "budget": parsed["budget"],
            "delivery_required": parsed["delivery_required"],
            "raw_prompt": prompt,
            "items": [
                {"resource_type": it["resource_type"], "quantity": it["quantity"]}
                for it in parsed["items"]
            ]
        }
        res_create = await client.post("/api/requirements", json=req_payload, headers=headers)
        assert res_create.status_code == 201, res_create.text
        req_data = res_create.json()
        print("Created Requirement ID:", req_data["id"])
        print("Items:", req_data["items"])
        assert len(req_data["items"]) == 2

        # 4. List seeker requirements
        res_list = await client.get("/api/requirements", headers=headers)
        assert res_list.status_code == 200
        assert len(res_list.json()) >= 1
        print("Seeker requirements listed successfully.")

    print("\n PHASE 3 BACKEND VERIFICATION PASSED SUCCESSFULLY! \n")

if __name__ == "__main__":
    asyncio.run(test_phase3())

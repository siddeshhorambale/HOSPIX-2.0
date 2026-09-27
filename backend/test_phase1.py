import asyncio
import httpx
from app.database import engine, Base
import app.models

async def test_db_and_auth():
    print("1. Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully!")

    # Test via FastAPI test client or direct async
    from app.main import app
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        res = await client.get("/api/health")
        print("Health check response:", res.status_code, res.json())
        assert res.status_code == 200

        # 2. Register provider
        reg_payload = {
            "email": "provider1@royalbanquets.com",
            "password": "Password123!",
            "full_name": "Rajesh Sharma",
            "role": "PROVIDER",
            "phone": "+91 98200 11223",
            "business_name": "Royal Banquets",
            "business_type": "hotel",
            "city": "Thane",
            "address": "Ghodbunder Road, Thane West",
            "latitude": 19.2183,
            "longitude": 72.9781
        }
        res_reg = await client.post("/api/auth/register", json=reg_payload)
        print("Register status:", res_reg.status_code)
        assert res_reg.status_code == 200, res_reg.text
        data = res_reg.json()
        token = data["access_token"]
        print("Registered user:", data["user"]["email"], "Role:", data["user"]["role"])
        print("Business:", data["user"]["business"]["name"], "City:", data["user"]["business"]["city"])

        # 3. Login
        login_payload = {
            "email": "provider1@royalbanquets.com",
            "password": "Password123!"
        }
        res_login = await client.post("/api/auth/login", json=login_payload)
        assert res_login.status_code == 200
        print("Login successful! Token generated.")

        # 4. /api/auth/me
        res_me = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res_me.status_code == 200
        print("Current user me:", res_me.json()["full_name"])

    print("\n PHASE 1 DATABASE & AUTH VERIFICATION PASSED SUCCESSFULLY! \n")

if __name__ == "__main__":
    asyncio.run(test_db_and_auth())

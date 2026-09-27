import asyncio
import httpx
from app.main import app

async def test_phase6_7():
    print("Testing Phase 6 (Bookings & State Machine) and Phase 7 (Inventory Subtraction)...")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Seed fresh
        await client.post("/api/seed")

        # Login Seeker (Apex Events)
        res_seeker_login = await client.post("/api/auth/login", json={
            "email": "seeker@apexevents.com",
            "password": "Password123!"
        })
        seeker_token = res_seeker_login.json()["access_token"]
        seeker_headers = {"Authorization": f"Bearer {seeker_token}"}

        # Login Provider (Royal Banquets)
        res_prov_login = await client.post("/api/auth/login", json={
            "email": "provider1@royalbanquets.com",
            "password": "Password123!"
        })
        prov_token = res_prov_login.json()["access_token"]
        prov_headers = {"Authorization": f"Bearer {prov_token}"}

        # 1. Get Royal Banquets chairs resource ID and initial quantity
        res_inv = await client.get("/api/resources/my-inventory", headers=prov_headers)
        chairs_res = next(r for r in res_inv.json() if "chair" in r["name"].lower())
        print(f"Resource '{chairs_res['name']}': Initial Available = {chairs_res['available_quantity']}")
        initial_qty = chairs_res["available_quantity"]

        # Create requirement
        res_req = await client.post("/api/requirements", json={
            "title": "Need 50 chairs for conference in Thane",
            "event_type": "conference",
            "location_city": "Thane",
            "event_date": "2026-10-10",
            "budget": 5000.0,
            "items": [{"resource_type": "chairs", "quantity": 50}]
        }, headers=seeker_headers)
        requirement_id = res_req.json()["id"]

        # 2. Seeker creates booking request (PENDING)
        batch_payload = {
            "requirement_id": requirement_id,
            "items": [
                {
                    "requirement_id": requirement_id,
                    "resource_id": chairs_res["id"],
                    "requested_quantity": 50,
                    "booking_date": "2026-10-10",
                    "unit_price": chairs_res["price"],
                    "delivery_required": True,
                    "delivery_charge": 500.0,
                    "notes": "Please deliver by 10 AM"
                }
            ]
        }
        res_requests = await client.post("/api/bookings/requests", json=batch_payload, headers=seeker_headers)
        assert res_requests.status_code == 201
        req_item = res_requests.json()[0]
        req_id = req_item["id"]
        print(f"1. Seeker created request ID {req_id} with status: {req_item['status']}")
        assert req_item["status"] == "PENDING"

        # 3. Provider checks incoming requests
        res_incoming = await client.get("/api/bookings/requests/incoming", headers=prov_headers)
        assert res_incoming.status_code == 200
        assert any(r["id"] == req_id for r in res_incoming.json())

        # 4. Provider proposes a Counter-Offer
        counter_payload = {
            "counter_quantity": 50,
            "counter_price": 32.0,  # modified price
            "counter_delivery_charge": 550.0,
            "notes": "₹32/day due to peak season demand"
        }
        res_counter = await client.post(f"/api/bookings/requests/{req_id}/counter", json=counter_payload, headers=prov_headers)
        assert res_counter.status_code == 200
        req_countered = res_counter.json()
        print(f"2. Provider submitted counter-offer. Request status: {req_countered['status']}")
        assert req_countered["status"] == "COUNTER_OFFER"
        assert len(req_countered["counter_offers"]) == 1
        counter_id = req_countered["counter_offers"][0]["id"]

        # 5. Seeker accepts Counter-Offer
        res_accept_c = await client.post(
            f"/api/bookings/requests/{req_id}/counter/{counter_id}/accept",
            headers=seeker_headers
        )
        assert res_accept_c.status_code == 200
        req_accepted = res_accept_c.json()
        print(f"3. Seeker accepted counter-offer. Status updated to: {req_accepted['status']}, Unit Price: {req_accepted['unit_price']}")
        assert req_accepted["status"] == "ACCEPTED"
        assert req_accepted["unit_price"] == 32.0

        # 6. Confirm Booking & Verify Transactional Inventory Subtraction (Phase 7)
        res_confirm = await client.post(f"/api/bookings/requests/{req_id}/confirm", headers=seeker_headers)
        assert res_confirm.status_code == 200
        booking_data = res_confirm.json()
        print(f"4. Booking CONFIRMED! Booking ID: {booking_data['id']}, Total: INR {booking_data['total_amount']}")
        assert booking_data["status"] == "CONFIRMED"

        # Verify provider's inventory decreased by 50
        res_inv_after = await client.get("/api/resources/my-inventory", headers=prov_headers)
        chairs_after = next(r for r in res_inv_after.json() if r["id"] == chairs_res["id"])
        print(f"5. Inventory subtraction check: Was {initial_qty}, Now {chairs_after['available_quantity']}")
        assert chairs_after["available_quantity"] == initial_qty - 50

        # 7. Test negative inventory prevention: Requesting more than remaining available
        excess_qty = chairs_after["available_quantity"] + 20
        fail_payload = {
            "requirement_id": requirement_id,
            "items": [
                {
                    "requirement_id": requirement_id,
                    "resource_id": chairs_res["id"],
                    "requested_quantity": excess_qty,
                    "booking_date": "2026-10-10",
                    "unit_price": 30.0,
                    "delivery_required": False,
                }
            ]
        }
        res_req_fail = await client.post("/api/bookings/requests", json=fail_payload, headers=seeker_headers)
        fail_req_id = res_req_fail.json()[0]["id"]
        res_confirm_fail = await client.post(f"/api/bookings/requests/{fail_req_id}/confirm", headers=prov_headers)
        print(f"6. Negative inventory protection: Attempting to confirm {excess_qty} units when only {chairs_after['available_quantity']} left (status {res_confirm_fail.status_code})")
        assert res_confirm_fail.status_code == 409  # Conflict!

        # 8. Cancel booking and verify inventory is restored
        res_cancel = await client.post(f"/api/bookings/{booking_data['id']}/cancel", headers=seeker_headers)
        assert res_cancel.status_code == 200
        res_inv_restored = await client.get("/api/resources/my-inventory", headers=prov_headers)
        chairs_restored = next(r for r in res_inv_restored.json() if r["id"] == chairs_res["id"])
        print(f"7. Cancellation inventory restoration check: Restored back to {chairs_restored['available_quantity']}")
        assert chairs_restored["available_quantity"] == initial_qty

    print("\n PHASE 6 & PHASE 7 COMPLETE VERIFICATION PASSED SUCCESSFULLY! \n")

if __name__ == "__main__":
    asyncio.run(test_phase6_7())

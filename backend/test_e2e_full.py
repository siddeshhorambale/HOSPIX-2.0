import asyncio
import httpx
from app.main import app

async def run_full_e2e():
    print("=================================================================")
    print("     HOSPIX END-TO-END MASTER SUITE: ALL PHASES 1 THROUGH 7     ")
    print("=================================================================")

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # -------------------------------------------------------------
        # 1. Database Seeding & Setup
        # -------------------------------------------------------------
        print("\n[PHASE 1] Initializing Database & Seeding Mumbai/Thane Providers...")
        res_seed = await client.post("/api/seed")
        assert res_seed.status_code == 200
        seed_data = res_seed.json()
        print(" Seeded Providers:", seed_data["seeded_providers"])
        assert len(seed_data["seeded_providers"]) == 4

        # -------------------------------------------------------------
        # 2. JWT Authentication (Register/Login/Roles)
        # -------------------------------------------------------------
        print("\n[PHASE 1] Verifying JWT Authentication & Roles...")
        # Login Seeker
        res_seeker_auth = await client.post("/api/auth/login", json={
            "email": "seeker@apexevents.com",
            "password": "Password123!"
        })
        assert res_seeker_auth.status_code == 200
        seeker_token = res_seeker_auth.json()["access_token"]
        seeker_headers = {"Authorization": f"Bearer {seeker_token}"}
        print(" Seeker authenticated: Apex Event Planners (Thane)")

        # Login Provider 1: Royal Banquets
        res_prov1_auth = await client.post("/api/auth/login", json={
            "email": "provider1@royalbanquets.com",
            "password": "Password123!"
        })
        assert res_prov1_auth.status_code == 200
        prov1_token = res_prov1_auth.json()["access_token"]
        prov1_headers = {"Authorization": f"Bearer {prov1_token}"}
        print(" Provider 1 authenticated: Royal Banquets (Thane)")

        # -------------------------------------------------------------
        # 3. Provider Dashboard & Resource Models (Phase 2)
        # -------------------------------------------------------------
        print("\n[PHASE 2] Verifying Provider Dashboard & Resource Catalog...")
        res_inv = await client.get("/api/resources/my-inventory", headers=prov1_headers)
        assert res_inv.status_code == 200
        inv_items = res_inv.json()
        print(f" Royal Banquets catalog has {len(inv_items)} live resources:")
        for it in inv_items:
            print(f"   • {it['name']}: {it['available_quantity']} units @ INR {it['price']}/day ({it['category']})")
        assert any("chair" in it["name"].lower() for it in inv_items)

        # -------------------------------------------------------------
        # 4. AI Requirement Parser (Phase 3)
        # -------------------------------------------------------------
        print("\n[PHASE 3] Testing AI Requirement Parser (POST /api/ai/parse-requirement)...")
        prompt = "Need 200 chairs and 20 tables for a wedding in Thane tomorrow, budget 15,000"
        res_ai = await client.post("/api/ai/parse-requirement", json={"prompt": prompt})
        assert res_ai.status_code == 200
        parsed = res_ai.json()
        print(" AI Parser result:")
        print("   Items:", parsed["items"])
        print("   Location:", parsed["location"])
        print("   Budget: INR", parsed["budget"])
        print("   Delivery Required:", parsed["delivery_required"])
        print("   Event Type:", parsed["event_type"])

        assert len(parsed["items"]) == 2
        assert parsed["items"][0]["quantity"] == 200
        assert parsed["items"][1]["quantity"] == 20
        assert parsed["location"]["city"].lower() == "thane"

        # Create requirement in DB
        res_req = await client.post("/api/requirements", json={
            "title": "Wedding in Thane (200 chairs, 20 tables)",
            "event_type": parsed["event_type"],
            "location_city": parsed["location"]["city"],
            "event_date": parsed["date"],
            "budget": parsed["budget"],
            "delivery_required": parsed["delivery_required"],
            "raw_prompt": prompt,
            "items": [
                {"resource_type": "chairs", "quantity": 200},
                {"resource_type": "tables", "quantity": 20}
            ]
        }, headers=seeker_headers)
        assert res_req.status_code == 201
        requirement_id = res_req.json()["id"]
        print(f" Requirement saved to database with ID #{requirement_id}")

        # -------------------------------------------------------------
        # 5. Matching & Pooling Engine (Phase 4 & Phase 5)
        # -------------------------------------------------------------
        print("\n[PHASE 4 & 5] Running Matching & Pooling Engine...")
        res_matches = await client.get(f"/api/requirements/{requirement_id}/matches", headers=seeker_headers)
        assert res_matches.status_code == 200
        matches = res_matches.json()
        print(f" Total generated solutions: {len(matches)}")

        single_matches = [m for m in matches if m["match_type"] == "SINGLE"]
        pooled_matches = [m for m in matches if m["match_type"] == "POOLED"]
        print(f"   Single Provider matches: {len(single_matches)}")
        print(f"   Pooled Multi-Provider matches: {len(pooled_matches)}")

        # No single provider has 200 chairs
        assert not any(m["is_full_coverage"] for m in single_matches), "Single provider cannot have 200 chairs alone"
        # Pooled matches must have full coverage solutions!
        assert any(m["is_full_coverage"] for m in pooled_matches), "Pooling algorithm must find 100% coverage bundles"

        top_match = matches[0]
        print("\n TOP RANKED MATCH:")
        print(f"   Type: {top_match['match_type']}")
        print(f"   Overall Score: {top_match['overall_score']}/100")
        print(f"   Total Cost: INR {top_match['total_cost']}")
        print(f"   Providers: {', '.join(top_match['provider_names'])}")
        print("   Why this match?")
        for exp in top_match["explanation"]:
            clean_exp = exp.replace(chr(8377), "INR ").replace("\u20b9", "INR ")
            print(f"     * {clean_exp}")


        # -------------------------------------------------------------
        # 6. Bookings & State Machine (Phase 6)
        # -------------------------------------------------------------
        print("\n[PHASE 6] Testing Bookings State Machine & Counter-Offers...")
        # Seeker sends booking request for top match
        batch_items = [
            {
                "requirement_id": requirement_id,
                "resource_id": it["resource_id"],
                "requested_quantity": it["offered_quantity"],
                "booking_date": parsed["date"],
                "unit_price": it["unit_price"],
                "delivery_required": True,
                "delivery_charge": it["delivery_charge"],
                "notes": "HOSPIX Coordinated Request"
            }
            for it in top_match["items"]
        ]
        res_booking_req = await client.post("/api/bookings/requests", json={
            "requirement_id": requirement_id,
            "items": batch_items
        }, headers=seeker_headers)
        assert res_booking_req.status_code == 201
        created_requests = res_booking_req.json()
        print(f" Created {len(created_requests)} coordinated booking requests (Status: PENDING)")
        
        # Select request belonging to Royal Banquets if present, or dynamically use target provider
        target_req = next((r for r in created_requests if "Royal Banquets" in (r.get("provider_name") or "")), None)
        if target_req:
            active_prov_headers = prov1_headers
        else:
            target_req = created_requests[0]
            email_map = {
                "Royal Banquets": "provider1@royalbanquets.com",
                "EventEase Rentals": "provider2@eventease.com",
                "PartyHub Events": "provider3@partyhub.com",
                "Grand Caterers": "provider4@grandcaterers.com",
            }
            prov_email = email_map.get(target_req.get("provider_name"), "provider1@royalbanquets.com")
            res_p_auth = await client.post("/api/auth/login", json={"email": prov_email, "password": "Password123!"})
            active_prov_headers = {"Authorization": f"Bearer {res_p_auth.json()['access_token']}"}

        print(f" Selected target request #{target_req['id']} with Provider: {target_req.get('provider_name')}")

        # Provider submits Counter-Offer
        res_counter = await client.post(f"/api/bookings/requests/{target_req['id']}/counter", json={
            "counter_quantity": target_req["requested_quantity"],
            "counter_price": target_req["unit_price"] + 2.0,
            "counter_delivery_charge": target_req["delivery_charge"],
            "notes": "Adjusted unit rate for peak wedding date"
        }, headers=active_prov_headers)
        assert res_counter.status_code == 200, f"Counter offer failed: {res_counter.text}"
        assert res_counter.json()["status"] == "COUNTER_OFFER"
        counter_id = res_counter.json()["counter_offers"][0]["id"]
        print(" Provider submitted counter-offer (Status: COUNTER_OFFER)")

        # Seeker accepts counter-offer
        res_accept_c = await client.post(
            f"/api/bookings/requests/{target_req['id']}/counter/{counter_id}/accept",
            headers=seeker_headers
        )
        assert res_accept_c.status_code == 200
        assert res_accept_c.json()["status"] == "ACCEPTED"
        print(" Seeker accepted counter-offer (Status: ACCEPTED)")

        # -------------------------------------------------------------
        # 7. Transactional Availability & Subtraction (Phase 7)
        # -------------------------------------------------------------
        print("\n[PHASE 7] Testing Transactional Confirmation & Inventory Subtraction...")
        # Get provider inventory before confirmation
        res_inv_before = await client.get("/api/resources/my-inventory", headers=active_prov_headers)
        res_obj_before = next(r for r in res_inv_before.json() if r["id"] == target_req["resource_id"])
        qty_before = res_obj_before["available_quantity"]

        # Confirm booking
        res_confirm = await client.post(f"/api/bookings/requests/{target_req['id']}/confirm", headers=seeker_headers)
        assert res_confirm.status_code == 200, f"Confirmation failed: {res_confirm.text}"
        booking = res_confirm.json()
        print(f" Booking CONFIRMED! ID #{booking['id']}, Status: {booking['status']}")

        # Verify inventory was subtracted
        res_inv_after = await client.get("/api/resources/my-inventory", headers=active_prov_headers)
        res_obj_after = next(r for r in res_inv_after.json() if r["id"] == target_req["resource_id"])
        qty_after = res_obj_after["available_quantity"]
        expected_after = qty_before - target_req["requested_quantity"]
        print(f" Inventory Subtraction: Was {qty_before}, Subtracted {target_req['requested_quantity']}, Now {qty_after}")
        assert qty_after == expected_after

        # Negative inventory protection
        print(" Verifying negative inventory protection against double-booking...")
        excess_request = await client.post("/api/bookings/requests", json={
            "requirement_id": requirement_id,
            "items": [{
                "requirement_id": requirement_id,
                "resource_id": target_req["resource_id"],
                "requested_quantity": qty_after + 50,
                "booking_date": parsed["date"],
                "unit_price": target_req["unit_price"],
                "delivery_required": False
            }]
        }, headers=seeker_headers)
        excess_req_id = excess_request.json()[0]["id"]
        res_conflict = await client.post(f"/api/bookings/requests/{excess_req_id}/confirm", headers=active_prov_headers)
        assert res_conflict.status_code == 409
        print(f" Double-booking / negative inventory correctly prevented with HTTP 409 Conflict: {res_conflict.json()['detail']}")

        # Cancellation restoration check
        print(" Verifying inventory restoration upon booking cancellation...")
        res_cancel = await client.post(f"/api/bookings/{booking['id']}/cancel", headers=seeker_headers)
        assert res_cancel.status_code == 200
        res_inv_restored = await client.get("/api/resources/my-inventory", headers=active_prov_headers)
        res_obj_restored = next(r for r in res_inv_restored.json() if r["id"] == target_req["resource_id"])
        print(f" Inventory after cancellation restored to {res_obj_restored['available_quantity']}")
        assert res_obj_restored["available_quantity"] == qty_before

    print("\n=================================================================")
    print("    ALL PHASES 1 THROUGH 7 VERIFIED AND WORKING END-TO-END!     ")
    print("=================================================================\n")

if __name__ == "__main__":
    asyncio.run(run_full_e2e())

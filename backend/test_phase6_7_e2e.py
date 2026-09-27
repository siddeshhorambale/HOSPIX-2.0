import requests

BASE_URL = "http://localhost:8000/api"

def run_e2e_test():
    print("--- 1. Authenticating Demo Accounts ---")
    # Login Seeker (Apex Events)
    r_seeker = requests.post(f"{BASE_URL}/auth/login", json={"email": "seeker@apexevents.com", "password": "Password123!"})
    if r_seeker.status_code != 200:
        print("Login seeker response:", r_seeker.status_code, r_seeker.text)
        return
    seeker_token = r_seeker.json()["access_token"]
    seeker_headers = {"Authorization": f"Bearer {seeker_token}", "Content-Type": "application/json"}
    print("Seeker authenticated successfully!")

    # Login Provider (Royal Banquets)
    r_prov = requests.post(f"{BASE_URL}/auth/login", json={"email": "provider1@royalbanquets.com", "password": "Password123!"})
    if r_prov.status_code != 200:
        print("Login provider response:", r_prov.status_code, r_prov.text)
        return
    prov_token = r_prov.json()["access_token"]
    prov_headers = {"Authorization": f"Bearer {prov_token}", "Content-Type": "application/json"}
    print("Provider authenticated successfully!")

    print("\n--- 2. Checking Provider Inventory ---")
    r_inv = requests.get(f"{BASE_URL}/resources/my-inventory", headers=prov_headers)
    inventory = r_inv.json()
    if not inventory:
        print("No inventory found for provider!")
        return
    target_res = inventory[0]
    initial_avail = target_res["available_quantity"]
    print(f"Target Resource: {target_res['name']} (ID {target_res['id']}), Available: {initial_avail}/{target_res['total_quantity']}")

    print("\n--- 3. Creating Resource Request (PENDING) ---")
    r_req = requests.post(f"{BASE_URL}/bookings/requests", headers=seeker_headers, json={
        "requirement_id": 1,
        "items": [{
            "requirement_id": 1,
            "resource_id": target_res["id"],
            "requested_quantity": 10,
            "booking_date": "2026-11-20",
            "start_time": "10:00",
            "end_time": "22:00",
            "unit_price": target_res["price"],
            "delivery_required": True,
            "delivery_charge": target_res.get("delivery_charge", 0),
            "notes": "E2E State Machine Test"
        }]
    })
    print("Create Request status:", r_req.status_code)
    req_data = r_req.json()[0]
    req_id = req_data["id"]
    print(f"Created Request #{req_id}, State = {req_data['status']}")
    assert req_data["status"] == "PENDING"

    print("\n--- 4. Provider Proposes Counter-Offer (COUNTER_OFFER) ---")
    r_counter = requests.post(f"{BASE_URL}/requests/{req_id}/counter-offer", headers=prov_headers, json={
        "counter_quantity": 8,
        "counter_price": target_res["price"] + 5,
        "counter_date": "2026-11-20",
        "counter_delivery_charge": 50.0,
        "notes": "Counter-offer: 8 units at revised rate"
    })
    print("Counter-Offer status:", r_counter.status_code)
    counter_data = r_counter.json()
    print(f"Request #{req_id} State after counter-offer = {counter_data['status']}")
    assert counter_data["status"] == "COUNTER_OFFER"
    counter_id = counter_data["counter_offers"][-1]["id"]

    print("\n--- 5. Seeker Accepts Counter-Offer (ACCEPTED) ---")
    r_accept = requests.post(f"{BASE_URL}/requests/{req_id}/counter/{counter_id}/accept", headers=seeker_headers)
    print("Accept Counter status:", r_accept.status_code)
    accept_data = r_accept.json()
    print(f"Request #{req_id} State after acceptance = {accept_data['status']}, Qty = {accept_data['requested_quantity']}")
    assert accept_data["status"] == "ACCEPTED"
    assert accept_data["requested_quantity"] == 8

    print("\n--- 6. Seeker Confirms Booking (CONFIRMED & Inventory Deducted) ---")
    r_confirm = requests.post(f"{BASE_URL}/bookings/requests/{req_id}/confirm", headers=seeker_headers)
    print("Confirm Booking status:", r_confirm.status_code)
    confirm_data = r_confirm.json()
    print(f"Booking #{confirm_data['id']} State = {confirm_data['status']}")
    assert confirm_data["status"] == "CONFIRMED"
    booking_id = confirm_data["id"]

    # Check that inventory was actually deducted in the DB!
    r_inv_after = requests.get(f"{BASE_URL}/resources/my-inventory", headers=prov_headers)
    res_after = next(r for r in r_inv_after.json() if r["id"] == target_res["id"])
    print(f"Inventory after confirmation: Available = {res_after['available_quantity']} (Initial was {initial_avail})")
    assert res_after["available_quantity"] == initial_avail - 8

    print("\n--- 7. Conflict Prevention Test (Overbooking attempt) ---")
    # Try to request more than the remaining inventory
    excess_qty = res_after["available_quantity"] + 10
    r_conflict_req = requests.post(f"{BASE_URL}/bookings/requests", headers=seeker_headers, json={
        "requirement_id": 1,
        "items": [{
            "requirement_id": 1,
            "resource_id": target_res["id"],
            "requested_quantity": excess_qty,
            "booking_date": "2026-11-20",
            "unit_price": target_res["price"],
            "delivery_required": False
        }]
    })
    conflict_req_id = r_conflict_req.json()[0]["id"]
    r_conflict_confirm = requests.post(f"{BASE_URL}/bookings/requests/{conflict_req_id}/confirm", headers=seeker_headers)
    print(f"Conflict confirm response status: {r_conflict_confirm.status_code}")
    print(f"Conflict confirm error detail: {r_conflict_confirm.json().get('detail')}")
    assert r_conflict_confirm.status_code == 409
    assert "This resource is no longer available for the selected time" in r_conflict_confirm.json().get("detail", "")

    print("\n--- 8. State Transitions: FULFILMENT & COMPLETED ---")
    r_fulfil = requests.put(f"{BASE_URL}/bookings/{booking_id}/state?target_status=FULFILMENT", headers=prov_headers)
    print("Fulfilment transition status:", r_fulfil.status_code, "State =", r_fulfil.json().get("status"))
    assert r_fulfil.json().get("status") == "FULFILMENT"

    r_comp = requests.put(f"{BASE_URL}/bookings/{booking_id}/state?target_status=COMPLETED", headers=prov_headers)
    print("Completed transition status:", r_comp.status_code, "State =", r_comp.json().get("status"))
    assert r_comp.json().get("status") == "COMPLETED"

    print("\n--- 9. Cleanup Test Booking ---")
    r_cancel = requests.post(f"{BASE_URL}/bookings/{booking_id}/cancel", headers=prov_headers)
    print("Cancel / inventory cleanup status:", r_cancel.status_code)

    print("\nALL PHASE 6 & 7 E2E TESTS PASSED SUCCESSFULLY! 🎉")

if __name__ == '__main__':
    run_e2e_test()

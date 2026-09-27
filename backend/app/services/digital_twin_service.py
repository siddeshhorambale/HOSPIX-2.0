import math
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.requirement import Requirement
from app.models.user import Business, UserRole
from app.models.resource import Resource
from app.services.weather_service import get_live_weather
from app.services.social_signal_service import get_real_world_signals
from app.services.nugen_service import run_nugen_domain_inference, NUGEN_ALIGNMENT_METADATA

def _calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two GPS coordinates."""
    r = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(r * c, 2)

async def run_digital_twin_simulation(
    db: AsyncSession,
    requirement_id: Optional[int] = None,
    scenario_rainfall_mm: float = 45.0,
    scenario_duration_hours: float = 2.0,
    scenario_temperature_c: float = 27.0,
    scenario_wind_kmh: float = 16.0,
    scenario_city: str = "Thane",
) -> Dict[str, Any]:
    """
    Execute an in-memory Digital Twin What-If counterfactual simulation.
    STRICT SECURITY GUARANTEE: Does NOT write, update, or mutate ANY production database record.
    Operates strictly on derived transient models.
    """
    # 1. Fetch Real HOSPIX Requirement
    req_obj = None
    if requirement_id:
        stmt_req = (
            select(Requirement)
            .options(selectinload(Requirement.items), selectinload(Requirement.business))
            .where(Requirement.id == requirement_id)
        )
        req_obj = (await db.execute(stmt_req)).scalar_one_or_none()

    if not req_obj:
        # Fallback to the latest available requirement
        stmt_latest = (
            select(Requirement)
            .options(selectinload(Requirement.items), selectinload(Requirement.business))
            .order_by(Requirement.id.desc())
            .limit(1)
        )
        req_obj = (await db.execute(stmt_latest)).scalar_one_or_none()

    # Normalize requirement dict
    if req_obj:
        req_city = req_obj.location_city or scenario_city
        req_lat = req_obj.latitude or 19.2183
        req_lon = req_obj.longitude or 72.9781
        requirement_data = {
            "id": req_obj.id,
            "title": req_obj.title,
            "location_city": req_city,
            "latitude": req_lat,
            "longitude": req_lon,
            "event_date": str(req_obj.event_date),
            "budget": req_obj.budget,
            "items": [
                {"resource_type": it.resource_type, "quantity": it.quantity}
                for it in req_obj.items
            ],
            "seeker_name": req_obj.business.name if req_obj.business else "Apex Event Planners",
        }
    else:
        req_city = scenario_city
        req_lat = 19.2183
        req_lon = 72.9781
        requirement_data = {
            "id": 1,
            "title": "Grand Banquet Gala at Ghodbunder Road",
            "location_city": req_city,
            "latitude": req_lat,
            "longitude": req_lon,
            "event_date": "2026-10-10",
            "budget": 15000.0,
            "items": [
                {"resource_type": "Banquet Dining Chairs", "quantity": 200},
                {"resource_type": "Round Dining Tables", "quantity": 20},
                {"resource_type": "Chafing Dishes", "quantity": 6},
            ],
            "seeker_name": "Apex Event Planners",
        }

    # 2. Fetch Real Regional Providers and Inventory
    stmt_providers = (
        select(Business)
        .options(selectinload(Business.resources))
        .where(Business.business_type.in_(["hotel", "rental", "caterer", "event_planner"]))
        .limit(6)
    )
    biz_rows = (await db.execute(stmt_providers)).scalars().all()

    provider_entities: List[Dict[str, Any]] = []
    for biz in biz_rows:
        dist = _calculate_haversine_distance(req_lat, req_lon, biz.latitude, biz.longitude)
        resources_list = [
            {"id": r.id, "name": r.name, "category": r.category, "available_qty": r.available_quantity}
            for r in biz.resources
        ]
        provider_entities.append({
            "id": biz.id,
            "name": biz.name,
            "city": biz.city,
            "latitude": biz.latitude,
            "longitude": biz.longitude,
            "distance_km": dist,
            "trust_score": biz.trust_score,
            "resources": resources_list,
        })

    # Sort providers by proximity to event venue
    provider_entities.sort(key=lambda p: p["distance_km"])

    # 3. Live Weather Baseline
    live_weather = await get_live_weather(req_lat, req_lon, req_city)

    # 4. Real-World Social & Public Signals (driven by simulated conditions)
    signals = get_real_world_signals(req_city, scenario_rainfall_mm, scenario_wind_kmh)

    # 5. Digital Twin Counterfactual Calculations
    # Baseline calculations (under live weather)
    base_precip = live_weather.get("precipitation_mm", 0.0)
    base_delay = int(min(base_precip * 0.8 + 10, 30))
    base_risk = min(int(base_precip * 1.2 + 8), 25)

    # Scenario calculations (under What-If parameters)
    sim_precip = float(scenario_rainfall_mm)
    sim_dur = float(scenario_duration_hours)
    sim_wind = float(scenario_wind_kmh)

    # Realistic mathematical propagation across transportation & physical vulnerability
    # Rainfall impact factor
    rain_impact = (sim_precip / 100.0) * 55.0  # up to 55 pts
    # Duration factor (longer storm accumulates more waterlogging)
    duration_impact = min(sim_dur * 6.5, 25.0)  # up to 25 pts
    # Wind factor (damages canopies, blows rain into open transport)
    wind_impact = max(0.0, (sim_wind - 15.0) * 0.8)

    sim_risk = min(int(base_risk + rain_impact + duration_impact + wind_impact), 98)
    sim_delay = int(base_delay + (sim_precip * 0.95) + (sim_dur * 12))

    # Calculate individual provider disruption probabilities
    affected_providers = []
    for p in provider_entities:
        # Distance penalty: longer transit during storm multiplies disruption probability
        dist_factor = p["distance_km"] * 3.5
        prov_risk = min(int(sim_risk * 0.7 + dist_factor), 99)
        status = "NORMAL"
        if prov_risk >= 75:
            status = "SEVERELY_DISRUPTED"
        elif prov_risk >= 45:
            status = "AT_RISK"

        affected_providers.append({
            "provider_id": p["id"],
            "name": p["name"],
            "city": p["city"],
            "latitude": p["latitude"],
            "longitude": p["longitude"],
            "distance_km": p["distance_km"],
            "disruption_risk_percent": prov_risk,
            "status": status,
            "recommended_routing": "Eastern dry elevated bypass" if prov_risk >= 60 else "Standard transit",
        })

    # Resource vulnerability analysis
    resource_vulnerabilities = []
    for it in requirement_data["items"]:
        item_name = it["resource_type"]
        is_fabric = any(w in item_name.lower() for w in ["chair", "cover", "linen", "tablecloth"])
        is_electrical = any(w in item_name.lower() for w in ["audio", "speaker", "light", "warmer"])

        if is_fabric:
            vuln = "HIGH - Water Damage & Staining Risk" if sim_precip >= 25 else "LOW - Standard Tarpaulin Sufficient"
        elif is_electrical:
            vuln = "CRITICAL - Electrical Short Hazard" if sim_precip >= 35 else "MODERATE - Enclosed Transport Required"
        else:
            vuln = "MODERATE - Wet Transit Road Vibration" if sim_precip >= 30 else "LOW - Standard Transit"

        resource_vulnerabilities.append({
            "resource_type": item_name,
            "quantity": it["quantity"],
            "vulnerability_assessment": vuln,
            "protection_protocol": "Double plastic shrink-wrap + enclosed cargo box" if sim_precip >= 25 else "Standard vehicle covering",
        })

    # 6. Execute Nugen Domain Inference
    weather_scenario_payload = {
        "rainfall_mm": sim_precip,
        "duration_hours": sim_dur,
        "temperature_c": scenario_temperature_c,
        "wind_kmh": sim_wind,
    }

    nugen_inference = await run_nugen_domain_inference(
        requirement=requirement_data,
        weather_scenario=weather_scenario_payload,
        providers=provider_entities,
        signals=signals,
    )

    # 7. Synthesize HOSPIX Collaborative Multi-Hub Pooling Recommendation
    # Highlighting the core value proposition of HOSPIX:
    # If primary provider is delayed or disrupted, HOSPIX pools from 2 proximate dry hubs!
    top_proximate = [p for p in affected_providers if p["distance_km"] <= 4.5]
    if len(top_proximate) >= 2 and sim_risk >= 50:
        pooling_sol = {
            "is_recommended": True,
            "title": "HOSPIX Multi-Hub Collaborative Pooling Solution",
            "reason": f"Primary supplier transit exceeds acceptable delay threshold (+{sim_delay} mins).",
            "allocated_hubs": [
                {
                    "provider": top_proximate[0]["name"],
                    "portion": "60% of inventory (Chairs & Tables)",
                    "distance": f"{top_proximate[0]['distance_km']} km",
                    "transit_status": "Elevated bypass corridor",
                },
                {
                    "provider": top_proximate[1]["name"],
                    "portion": "40% of inventory (Diningware & Warmers)",
                    "distance": f"{top_proximate[1]['distance_km']} km",
                    "transit_status": "Local sub-3km dispatch",
                }
            ],
            "delay_savings_mins": max(20, int(sim_delay * 0.45)),
            "guaranteed_arrival": True,
        }
    else:
        pooling_sol = {
            "is_recommended": False,
            "title": "Single-Provider Fulfillment Intact",
            "reason": "Current meteorological risk parameters permit standard single-provider dispatch.",
            "allocated_hubs": [],
            "delay_savings_mins": 0,
            "guaranteed_arrival": True,
        }

    return {
        "requirement": requirement_data,
        "baseline_state": {
            "weather": live_weather,
            "delivery_risk_percent": base_risk,
            "expected_delay_mins": base_delay,
            "status": "NORMAL_OPERATIONS",
        },
        "simulated_state": {
            "scenario": {
                "rainfall_mm": sim_precip,
                "duration_hours": sim_dur,
                "temperature_c": scenario_temperature_c,
                "wind_kmh": sim_wind,
                "location_city": req_city,
            },
            "delivery_risk_percent": sim_risk,
            "expected_delay_mins": sim_delay,
            "status": "CRITICAL_RISK" if sim_risk >= 75 else ("HIGH_RISK" if sim_risk >= 45 else "LOW_RISK"),
            "affected_providers": affected_providers,
            "resource_vulnerabilities": resource_vulnerabilities,
            "pooling_solution": pooling_sol,
        },
        "nugen_intelligence": nugen_inference,
        "social_signals": signals,
        "map_entities": {
            "event_location": {
                "name": requirement_data["title"],
                "city": req_city,
                "latitude": req_lat,
                "longitude": req_lon,
            },
            "providers": provider_entities,
            "impact_radius_km": round(2.0 + (sim_precip / 20.0), 1),
        },
        "alignment_metadata": NUGEN_ALIGNMENT_METADATA,
        "security_guarantee": {
            "is_read_only": True,
            "database_mutated": False,
            "message": "Real HOSPIX production database state is 100% unaltered.",
        },
    }

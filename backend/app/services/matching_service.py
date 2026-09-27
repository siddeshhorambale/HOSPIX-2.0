import math
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.requirement import Requirement
from app.models.resource import Resource
from app.models.match import MatchType
from app.services.pooling_engine import run_pooling_engine

async def generate_matches_for_requirement(db: AsyncSession, requirement: Requirement) -> Dict[str, List[Dict[str, Any]]]:
    """
    Evaluates individual provider matches and generates multi-provider pooled solutions.
    Strictly separates single matches from pooled solutions (enforcing pool size >= 2).
    """
    req_items = requirement.items
    if not req_items:
        return {"single_matches": [], "pooled_solutions": []}
        
    req_budget = requirement.budget or float('inf')
    single_matches = []
    pooled_solutions = []

    for req_item in req_items:
        # Get providers offering matching resources
        stmt = select(Resource).options(selectinload(Resource.business)).where(
            Resource.name.ilike(f"%{req_item.resource_type}%"),
            Resource.status == "ACTIVE"
        )
        resources = (await db.execute(stmt)).scalars().all()
        
        # 1. Single Matches: Individual providers where available_quantity >= requested_quantity
        seen_single_ids = set()
        cands = []

        for res in resources:
            effective_qty = res.available_quantity
            if effective_qty <= 0:
                continue
            
            price = res.price
            total_cost = price * req_item.quantity

            if effective_qty >= req_item.quantity and total_cost <= req_budget:
                if res.id not in seen_single_ids:
                    seen_single_ids.add(res.id)
                    provider_name = res.business.name if res.business else "Provider"
                    delivery = res.delivery_charge if getattr(res, "delivery_available", True) else 0.0

                    single_matches.append({
                        "match_type": MatchType.SINGLE.value,
                        "overall_score": 95,
                        "availability_score": 100,
                        "quantity_score": 100,
                        "distance_score": 90,
                        "price_score": 90,
                        "compatibility_score": 95,
                        "trust_score": res.business.trust_score if res.business else 90.0,
                        "total_cost": total_cost + delivery,
                        "explanation": [f"100% quantity ({req_item.quantity} units) fulfilled by single provider"],
                        "is_full_coverage": True,
                        "provider_names": [provider_name],
                        "items": [{
                            "resource": res,
                            "offered_quantity": req_item.quantity,
                            "unit_price": price,
                            "subtotal": total_cost,
                            "delivery_charge": delivery
                        }]
                    })
            
            # Add to candidate list for pooling engine
            cands.append({
                "resource": res,
                "effective_qty": effective_qty,
                "unit_price": price,
                "delivery_charge": res.delivery_charge if getattr(res, "delivery_available", True) else 0.0,
                "overall_score": 90
            })
            
        # 2. Pooled Solutions: Strictly size >= 2
        pooled = run_pooling_engine(
            requirement_quantity=req_item.quantity,
            budget=req_budget,
            available_providers=cands
        )
        
        seen_pool_combos = set()
        for pool in pooled:
            # Check unique combo of provider names / IDs
            combo_key = tuple(sorted(pool["provider_names"]))
            if combo_key in seen_pool_combos:
                continue
            if len(pool["provider_names"]) < 2:
                # Defensive check: strictly enforce size >= 2
                continue
            seen_pool_combos.add(combo_key)
            
            pooled_match_items = []
            for c_item in pool["combo_items"]:
                res = c_item["provider"]["resource"]
                pooled_match_items.append({
                    "resource": res,
                    "offered_quantity": c_item["allocated_qty"],
                    "unit_price": c_item["provider"]["unit_price"],
                    "subtotal": c_item["subtotal"],
                    "delivery_charge": c_item["delivery_charge"],
                })
                
            pooled_solutions.append({
                "match_type": MatchType.POOLED.value,
                "overall_score": 90.0,
                "availability_score": 100.0,
                "quantity_score": 100.0,
                "distance_score": 85.0,
                "price_score": 90.0,
                "compatibility_score": 95.0,
                "trust_score": pool["avg_trust"],
                "total_cost": pool["total_cost"],
                "explanation": [f"Coordinated {len(pool['provider_names'])}-provider pooled solution"],
                "is_full_coverage": True,
                "provider_names": pool["provider_names"],
                "items": pooled_match_items,
            })

    # Sort each array independently
    single_matches.sort(key=lambda m: (m["total_cost"], -m["overall_score"]))
    pooled_solutions.sort(key=lambda m: (len(m["provider_names"]), m["total_cost"], -m["overall_score"]))

    return {
        "single_matches": single_matches,
        "pooled_solutions": pooled_solutions
    }

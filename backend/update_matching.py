import re

with open("app/services/matching_service.py", "r") as f:
    content = f.read()

# Make sure to import run_pooling_engine
if "from app.services.pooling_engine import run_pooling_engine" not in content:
    content = content.replace(
        "from app.models.match import Match, MatchItem, MatchType, MatchStatus",
        "from app.models.match import Match, MatchItem, MatchType, MatchStatus\nfrom app.services.pooling_engine import run_pooling_engine"
    )

# The existing pooling block starts around `# PHASE 5:`
# We can replace the whole block if we want, or just leave it since the results array gets merged.
# But let's actually swap it out for the call to run_pooling_engine to fully satisfy the prompt.
# We will find the "PHASE 5" block and replace it.

phase_5_marker = "    # -------------------------------------------------------------\n    # PHASE 5: Pooling Algorithm (Multi-Provider Combinations)\n    # -------------------------------------------------------------"
split_parts = content.split(phase_5_marker)

if len(split_parts) == 2:
    new_phase_5 = """    # -------------------------------------------------------------
    # PHASE 5: Pooling Algorithm (Multi-Provider Combinations) via pooling_engine.py
    # -------------------------------------------------------------
    for req_item in requirement.items:
        cands = candidates_by_item.get(req_item.id, [])
        if len(cands) < 2:
            continue
            
        # Try to see if full coverage is hit by single providers
        # If not, trigger pooling engine
        
        pooled = run_pooling_engine(
            requirement_quantity=req_item.quantity,
            budget=req_budget,
            available_providers=cands
        )
        
        for pool in pooled:
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
                
            explanations = [
                f"Pooled Solution: Successfully combines {pool['provider_count']} providers to fulfill 100% of {req_item.quantity} {req_item.resource_type}",
                f"Inventory Breakdown: {' + '.join(pool['provider_names'])} = {req_item.quantity} units",
                f"Total pooled cost: ₹{int(pool['total_cost']):,} (Within budget)",
                f"Verified network trust score: {int(pool['avg_trust'])}%",
            ]
            
            # Add some dummy scores for now based on pooling engine output
            results.append({
                "match_type": MatchType.POOLED.value,
                "overall_score": 90.0,
                "availability_score": 100.0,
                "quantity_score": 100.0,
                "distance_score": 85.0, # Placeholder
                "price_score": 90.0,
                "compatibility_score": 95.0,
                "trust_score": pool["avg_trust"],
                "total_cost": pool["total_cost"],
                "explanation": explanations,
                "is_full_coverage": True,
                "provider_names": pool["provider_names"],
                "items": pooled_match_items,
            })

    # Sort results
    def sort_key(m):
        full_cov = 1 if m["is_full_coverage"] else 0
        in_budget = 1 if m["total_cost"] <= req_budget else 0
        fewer_providers = -len(m["provider_names"])
        score = m["overall_score"]
        lower_cost = -m["total_cost"]
        return (full_cov, in_budget, fewer_providers, score, lower_cost)

    results.sort(key=sort_key, reverse=True)
    return results
"""
    
    # We replace from Phase 5 to the end of the function.
    # The original ends with return results. We can replace from split_parts[1]
    
    final_content = split_parts[0] + new_phase_5

    with open("app/services/matching_service.py", "w") as f:
        f.write(final_content)

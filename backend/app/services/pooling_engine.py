import itertools
from typing import List, Dict, Any

def run_pooling_engine(
    requirement_quantity: int,
    budget: float,
    available_providers: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Multi-Provider Resource Pooling Algorithm.
    Generates combinations of providers when no single provider can fulfill a seeker's required quantity.
    Strictly enforces combination size >= 2 and eliminates duplicate combinations.
    """
    
    # 1. Filter: Remove any providers with 0 available inventory.
    valid_providers = [p for p in available_providers if p.get("effective_qty", 0) > 0]
    
    # 2. Sort: Order remaining providers by individual match score descending.
    sorted_providers = sorted(
        valid_providers, 
        key=lambda p: p.get("overall_score", p.get("effective_qty", 0)), 
        reverse=True
    )
    
    valid_combinations = []
    seen_combos = set()
    
    # 3. Combine: Enforce Size >= 2 (r starts strictly at 2, up to 3)
    # The pooling algorithm must ONLY use itertools.combinations(valid_providers, r) where r starts at 2
    max_r = min(len(sorted_providers) + 1, 4)
    for r in range(2, max_r):
        for combo in itertools.combinations(sorted_providers, r):
            # Ensure distinct providers in combination (provider_id must be unique)
            provider_ids = tuple(sorted(c["resource"].provider_id for c in combo))
            if len(set(provider_ids)) < len(combo):
                continue
                
            # Quick check if this exact provider set was already processed
            if provider_ids in seen_combos:
                continue
                
            total_qty = sum(c["effective_qty"] for c in combo)
            # Must fulfill the requirement entirely
            if total_qty < requirement_quantity:
                continue
                
            # 4. Allocate quantities across combination
            remaining_needed = requirement_quantity
            total_cost = 0.0
            combo_items = []
            provider_names = []
            
            for c in combo:
                allocated_qty = min(remaining_needed, c["effective_qty"])
                if allocated_qty <= 0:
                    continue
                subtotal = allocated_qty * c["unit_price"]
                delivery = c.get("delivery_charge", 0.0)
                
                total_cost += subtotal + delivery
                provider_name = c["resource"].business.name if (c["resource"].business and c["resource"].business.name) else "Provider"
                provider_names.append(provider_name)
                
                combo_items.append({
                    "provider": c,
                    "allocated_qty": allocated_qty,
                    "subtotal": subtotal,
                    "delivery_charge": delivery
                })
                
                remaining_needed -= allocated_qty
                if remaining_needed <= 0:
                    break
            
            # Enforce size >= 2: combination must actually utilize at least 2 distinct providers!
            # Every provider in combo MUST contribute (avoids duplicate subsets when r increases)
            if len(combo_items) < len(combo) or len(combo_items) < 2 or len(set(provider_names)) < 2:
                continue
                
            # Check duplicate by provider names set or provider IDs tuple
            names_key = tuple(sorted(provider_names))
            if names_key in seen_combos:
                continue

            # Add to valid combos if budget condition met and fully fulfilled
            if remaining_needed <= 0 and total_cost <= budget:
                seen_combos.add(names_key)
                seen_combos.add(provider_ids)
                
                avg_trust = sum(
                    c["resource"].business.trust_score if c["resource"].business else 90.0 
                    for c in combo
                ) / len(combo)
                
                valid_combinations.append({
                    "combo_items": combo_items,
                    "total_quantity": requirement_quantity,
                    "total_cost": total_cost,
                    "provider_names": provider_names,
                    "provider_count": len(combo_items),
                    "avg_trust": avg_trust
                })
                
    # 5. Rank: Sort valid combinations
    # Priority: Fewer providers (asc), Lower total cost (asc), Higher trust (desc)
    def sort_key(combo_data):
        return (
            combo_data["provider_count"],      # 1. Fewer providers
            combo_data["total_cost"],          # 2. Lower total cost
            -combo_data["avg_trust"]           # 3. Better trust
        )
        
    valid_combinations.sort(key=sort_key)
    return valid_combinations

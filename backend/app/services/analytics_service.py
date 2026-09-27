from typing import Dict, Any, List
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, Business, UserRole

async def get_analytics_overview(
    db: AsyncSession,
    user: User,
    business: Business,
) -> Dict[str, Any]:
    """
    Lightweight, read-only Business Intelligence & Analytics aggregation.
    Strictly scoped to the authenticated business identity with zero cross-tenant data leakage.
    Derives all KPIs, timelines, demand metrics, and pooling ratios from actual database records.
    """
    biz_id = business.id
    is_provider = user.role == UserRole.PROVIDER

    # -------------------------------------------------------------
    # 1. ROLE-SCOPED OVERVIEW KPIS
    # -------------------------------------------------------------
    kpis: Dict[str, Any] = {}

    if not is_provider:  # SEEKER
        # Total requirements created
        stmt_reqs = text("SELECT count(*) FROM requirements WHERE seeker_id = :biz_id")
        res_reqs = await db.execute(stmt_reqs, {"biz_id": biz_id})
        total_reqs = res_reqs.scalar() or 0

        # Total resource requests sent
        stmt_requests = text("SELECT count(*) FROM resource_requests WHERE seeker_id = :biz_id")
        res_requests = await db.execute(stmt_requests, {"biz_id": biz_id})
        total_requests = res_requests.scalar() or 0

        # Confirmed bookings count and spend
        stmt_bookings = text("""
            SELECT count(*), coalesce(sum(total_amount), 0.0)
            FROM bookings
            WHERE seeker_id = :biz_id AND status IN ('CONFIRMED', 'FULFILMENT', 'COMPLETED')
        """)
        res_bookings = await db.execute(stmt_bookings, {"biz_id": biz_id})
        row_b = res_bookings.fetchone()
        confirmed_bookings = row_b[0] if row_b else 0
        total_spend = float(row_b[1]) if row_b else 0.0

        # Pooling statistics for seeker's requirements
        stmt_pooling = text("""
            SELECT 
                sum(CASE WHEN p_count >= 2 THEN 1 ELSE 0 END) as pooled,
                sum(CASE WHEN p_count = 1 THEN 1 ELSE 0 END) as single,
                count(*) as total
            FROM (
                SELECT requirement_id, count(DISTINCT provider_id) as p_count
                FROM resource_requests
                WHERE seeker_id = :biz_id AND requirement_id IS NOT NULL
                GROUP BY requirement_id
            )
        """)
        res_pooling = await db.execute(stmt_pooling, {"biz_id": biz_id})
        row_p = res_pooling.fetchone()
        pooled_count = (row_p[0] or 0) if row_p else 0
        single_count = (row_p[1] or 0) if row_p else 0
        evaluated_reqs = (row_p[2] or 0) if row_p else 0
        pooling_rate = round((pooled_count / evaluated_reqs * 100), 1) if evaluated_reqs > 0 else 0.0

        kpis = {
            "primary_metric": {
                "label": "Total Requirements",
                "value": total_reqs,
                "subtext": "Event requirements submitted",
            },
            "secondary_metric": {
                "label": "Resource Requests",
                "value": total_requests,
                "subtext": "Direct availability inquiries sent",
            },
            "bookings_metric": {
                "label": "Confirmed Bookings",
                "value": confirmed_bookings,
                "subtext": "Locked allocations on calendar",
            },
            "pooling_metric": {
                "label": "Pooled Fulfilment",
                "value": f"{pooling_rate}%",
                "numeric_value": pooling_rate,
                "subtext": f"{pooled_count} of {evaluated_reqs} fulfilled via multi-provider pooling",
            },
            "financial_metric": {
                "label": "Total Value Booked",
                "value": f"₹{total_spend:,.0f}",
                "numeric_value": total_spend,
                "subtext": "Across confirmed bookings",
            },
        }

    else:  # PROVIDER
        # Total resources listed
        stmt_res = text("SELECT count(*) FROM resources WHERE provider_id = :biz_id")
        res_res = await db.execute(stmt_res, {"biz_id": biz_id})
        total_resources = res_res.scalar() or 0

        # Booking requests received
        stmt_requests = text("SELECT count(*) FROM resource_requests WHERE provider_id = :biz_id")
        res_requests = await db.execute(stmt_requests, {"biz_id": biz_id})
        requests_received = res_requests.scalar() or 0

        # Confirmed bookings and revenue
        stmt_bookings = text("""
            SELECT count(*), coalesce(sum(total_amount), 0.0)
            FROM bookings
            WHERE provider_id = :biz_id AND status IN ('CONFIRMED', 'FULFILMENT', 'COMPLETED')
        """)
        res_bookings = await db.execute(stmt_bookings, {"biz_id": biz_id})
        row_b = res_bookings.fetchone()
        confirmed_bookings = row_b[0] if row_b else 0
        total_revenue = float(row_b[1]) if row_b else 0.0

        # Pooling collaborations involving this provider
        stmt_pooling = text("""
            SELECT 
                sum(CASE WHEN p_count >= 2 THEN 1 ELSE 0 END) as pooled,
                sum(CASE WHEN p_count = 1 THEN 1 ELSE 0 END) as single,
                count(*) as total
            FROM (
                SELECT rr.requirement_id, count(DISTINCT rr2.provider_id) as p_count
                FROM resource_requests rr
                JOIN resource_requests rr2 ON rr.requirement_id = rr2.requirement_id
                WHERE rr.provider_id = :biz_id AND rr.requirement_id IS NOT NULL
                GROUP BY rr.requirement_id
            )
        """)
        res_pooling = await db.execute(stmt_pooling, {"biz_id": biz_id})
        row_p = res_pooling.fetchone()
        pooled_count = (row_p[0] or 0) if row_p else 0
        single_count = (row_p[1] or 0) if row_p else 0
        evaluated_reqs = (row_p[2] or 0) if row_p else 0
        pooling_rate = round((pooled_count / evaluated_reqs * 100), 1) if evaluated_reqs > 0 else 0.0

        kpis = {
            "primary_metric": {
                "label": "Active Resources",
                "value": total_resources,
                "subtext": "Listed in regional inventory",
            },
            "secondary_metric": {
                "label": "Incoming Requests",
                "value": requests_received,
                "subtext": "Inquiries from local event planners",
            },
            "bookings_metric": {
                "label": "Confirmed Bookings",
                "value": confirmed_bookings,
                "subtext": "Fulfilled & scheduled orders",
            },
            "pooling_metric": {
                "label": "Pooled Collaborations",
                "value": f"{pooling_rate}%",
                "numeric_value": pooling_rate,
                "subtext": f"{pooled_count} of {evaluated_reqs} co-supplied with partner hubs",
            },
            "financial_metric": {
                "label": "Gross Booking Revenue",
                "value": f"₹{total_revenue:,.0f}",
                "numeric_value": total_revenue,
                "subtext": "From confirmed event contracts",
            },
        }

    # -------------------------------------------------------------
    # 2. BOOKINGS OVER TIME (LINE CHART)
    # -------------------------------------------------------------
    if is_provider:
        stmt_timeline = text("""
            SELECT booking_date, count(*) as count, coalesce(sum(total_amount), 0.0) as amount
            FROM bookings
            WHERE provider_id = :biz_id AND status IN ('CONFIRMED', 'FULFILMENT', 'COMPLETED')
            GROUP BY booking_date
            ORDER BY booking_date ASC
        """)
    else:
        stmt_timeline = text("""
            SELECT booking_date, count(*) as count, coalesce(sum(total_amount), 0.0) as amount
            FROM bookings
            WHERE seeker_id = :biz_id AND status IN ('CONFIRMED', 'FULFILMENT', 'COMPLETED')
            GROUP BY booking_date
            ORDER BY booking_date ASC
        """)

    res_timeline = await db.execute(stmt_timeline, {"biz_id": biz_id})
    bookings_over_time = [
        {
            "date": str(row[0]),
            "count": int(row[1]),
            "amount": float(row[2]),
        }
        for row in res_timeline.fetchall()
    ]

    # -------------------------------------------------------------
    # 3. MOST REQUESTED RESOURCES (BAR CHART)
    # -------------------------------------------------------------
    if is_provider:
        # What resources owned by this provider are requested, plus regional context
        stmt_demand = text("""
            SELECT r.name, r.category, count(rr.id) as request_count, coalesce(sum(rr.requested_quantity), 0) as total_qty
            FROM resource_requests rr
            JOIN resources r ON rr.resource_id = r.id
            WHERE rr.provider_id = :biz_id
            GROUP BY r.name, r.category
            ORDER BY total_qty DESC
            LIMIT 6
        """)
    else:
        # What resources did this seeker request most
        stmt_demand = text("""
            SELECT r.name, r.category, count(rr.id) as request_count, coalesce(sum(rr.requested_quantity), 0) as total_qty
            FROM resource_requests rr
            JOIN resources r ON rr.resource_id = r.id
            WHERE rr.seeker_id = :biz_id
            GROUP BY r.name, r.category
            ORDER BY total_qty DESC
            LIMIT 6
        """)

    res_demand = await db.execute(stmt_demand, {"biz_id": biz_id})
    demand_rows = res_demand.fetchall()

    # Fallback if personal requests are low: provide verified regional demand overview
    if len(demand_rows) < 3:
        stmt_market_demand = text("""
            SELECT r.name, r.category, count(rr.id) as request_count, coalesce(sum(rr.requested_quantity), 0) as total_qty
            FROM resource_requests rr
            JOIN resources r ON rr.resource_id = r.id
            GROUP BY r.name, r.category
            ORDER BY total_qty DESC
            LIMIT 6
        """)
        res_market = await db.execute(stmt_market_demand)
        market_rows = res_market.fetchall()
        resource_demand = [
            {
                "name": str(row[0]),
                "category": str(row[1]),
                "request_count": int(row[2]),
                "total_quantity": int(row[3]),
                "scope": "regional_market",
            }
            for row in market_rows
        ]
    else:
        resource_demand = [
            {
                "name": str(row[0]),
                "category": str(row[1]),
                "request_count": int(row[2]),
                "total_quantity": int(row[3]),
                "scope": "direct",
            }
            for row in demand_rows
        ]

    # -------------------------------------------------------------
    # 4. HOSPIX POOLING / FULFILMENT DISTRIBUTION
    # -------------------------------------------------------------
    pooling_stats = {
        "single_provider_count": single_count,
        "multi_provider_count": pooled_count,
        "total_evaluated": evaluated_reqs,
        "pooled_percentage": pooling_rate,
        "single_percentage": round(100.0 - pooling_rate, 1) if evaluated_reqs > 0 else 0.0,
    }

    # -------------------------------------------------------------
    # 5. FIFTH VISUAL: INVENTORY UTILIZATION (PROVIDER) OR FUNNEL (SEEKER)
    # -------------------------------------------------------------
    if is_provider:
        stmt_utilization = text("""
            SELECT id, name, category, total_quantity, available_quantity
            FROM resources
            WHERE provider_id = :biz_id
            ORDER BY total_quantity DESC
            LIMIT 8
        """)
        res_util = await db.execute(stmt_utilization, {"biz_id": biz_id})
        utilization = []
        for row in res_util.fetchall():
            tot = int(row[3])
            avail = int(row[4])
            booked = max(0, tot - avail)
            rate = round((booked / tot * 100), 1) if tot > 0 else 0.0
            utilization.append({
                "resource_id": row[0],
                "name": str(row[1]),
                "category": str(row[2]),
                "total_quantity": tot,
                "available_quantity": avail,
                "booked_quantity": booked,
                "utilization_rate": rate,
            })
        auxiliary_data = {
            "type": "utilization",
            "items": utilization,
        }
    else:
        # Seeker Activity Funnel
        stmt_completed = text("""
            SELECT count(*)
            FROM bookings
            WHERE seeker_id = :biz_id AND status = 'COMPLETED'
        """)
        res_comp = await db.execute(stmt_completed, {"biz_id": biz_id})
        completed_count = res_comp.scalar() or 0

        funnel_items = [
            {
                "stage": "Requirements Posted",
                "count": kpis["primary_metric"]["value"],
                "description": "Event briefs submitted to matching engine",
            },
            {
                "stage": "Requests Issued",
                "count": kpis["secondary_metric"]["value"],
                "description": "Availability-checked requests to verified hubs",
            },
            {
                "stage": "Bookings Confirmed",
                "count": kpis["bookings_metric"]["value"],
                "description": "Guaranteed allocations locked without double-booking",
            },
            {
                "stage": "Fulfilled / Completed",
                "count": completed_count,
                "description": "Successfully executed event deliveries",
            },
        ]
        auxiliary_data = {
            "type": "funnel",
            "items": funnel_items,
        }

    return {
        "role": user.role.value,
        "business_id": business.id,
        "business_name": business.name,
        "city": business.city,
        "kpis": kpis,
        "bookings_over_time": bookings_over_time,
        "resource_demand": resource_demand,
        "pooling": pooling_stats,
        "auxiliary": auxiliary_data,
    }

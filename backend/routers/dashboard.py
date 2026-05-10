from fastapi import APIRouter
from data.store import ORDERS, PRODUCTS

router = APIRouter()


@router.get("/stats")
def dashboard_stats():
    orders = list(ORDERS.values())
    today = "2026-05-10"
    week_dates = [f"2026-05-0{d}" for d in range(5, 11)] + ["2026-05-10"]

    today_orders   = [o for o in orders if o["created_at"].startswith(today)]
    week_orders    = [o for o in orders if any(o["created_at"].startswith(d) for d in week_dates)]
    pending        = [o for o in orders if o["status"] == "pending"]
    shipped_today  = [o for o in today_orders if o["status"] in ("shipped", "delivered")]
    low_stock      = [p for p in PRODUCTS.values() if p["stock_alert"] in ("low", "critical", "out_of_stock")]
    delayed_cargo  = [o for o in orders if o.get("cargo_tracking_number") and
                      _cargo_is_delayed(o["cargo_tracking_number"])]

    return {
        "total_orders_today":     len(today_orders),
        "orders_this_week":       len(week_orders),
        "pending_orders":         len(pending),
        "orders_shipped_today":   len(shipped_today),
        "total_revenue_today":    sum(o["total_amount"] for o in today_orders if o["status"] != "cancelled"),
        "total_revenue_week":     sum(o["total_amount"] for o in week_orders  if o["status"] != "cancelled"),
        "low_stock_products":     len(low_stock),
        "delayed_shipments":      len(delayed_cargo),
    }


def _cargo_is_delayed(tracking_number: str) -> bool:
    from data.store import CARGO
    c = CARGO.get(tracking_number)
    return bool(c and c.get("is_delayed"))


@router.get("/recent-activity")
def recent_activity():
    orders = sorted(ORDERS.values(), key=lambda o: o["created_at"], reverse=True)
    return [
        {
            "id": o["id"],
            "customer_name": o["customer_name"],
            "total_amount": o["total_amount"],
            "status": o["status"],
            "updated_at": o["updated_at"],
        }
        for o in orders[:6]
    ]


@router.get("/order-trend")
def order_trend():
    labels = [
        ("5 May", "2026-05-05"),
        ("6 May", "2026-05-06"),
        ("7 May", "2026-05-07"),
        ("8 May", "2026-05-08"),
        ("9 May", "2026-05-09"),
        ("10 May", "2026-05-10"),
    ]
    orders = list(ORDERS.values())
    result = []
    for label, date in labels:
        count = sum(1 for o in orders if o["created_at"].startswith(date))
        # Add some simulated historical data for earlier dates with no real orders
        if count == 0:
            simulated = {"2026-05-05": 8, "2026-05-06": 11}.get(date, 0)
            count = simulated
        result.append({"date": label, "orders": count})
    return result

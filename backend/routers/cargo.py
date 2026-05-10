from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import datetime
from data.store import CARGO, ORDERS
import uuid, random, string

router = APIRouter()

VALID_CARGO_STATUSES = {
    "not_shipped", "picked_up", "in_transit",
    "out_for_delivery", "delivered", "delayed", "returned"
}


def _gen_tracking(carrier: str) -> str:
    prefix = {
        "Yurtiçi Kargo": "YK",
        "Aras Kargo": "ARS",
        "MNG Kargo": "MNG",
        "PTT Kargo": "PTT",
        "Sürat Kargo": "SRT",
    }.get(carrier, "CRG")
    digits = ''.join(random.choices(string.digits, k=9))
    return f"{prefix}{digits}TR"


# ── GET /cargo/delayed  (before /{tracking}) ──────────────
@router.get("/delayed")
def get_delayed():
    return [c for c in CARGO.values() if c.get("is_delayed")]


# ── GET /cargo/order/{order_id}  (before /{tracking}) ─────
@router.get("/order/{order_id}")
def cargo_by_order(order_id: str):
    for c in CARGO.values():
        if c["order_id"] == order_id:
            return c
    raise HTTPException(404, f"Kargo bulunamadı (sipariş {order_id})")


@router.get("/")
def list_cargo(status: Optional[str] = None):
    items = list(CARGO.values())
    if status:
        items = [c for c in items if c["status"] == status]
    return sorted(items, key=lambda c: c["last_update"], reverse=True)


@router.get("/{tracking_number}")
def get_cargo(tracking_number: str):
    c = CARGO.get(tracking_number)
    if not c:
        raise HTTPException(404, f"Takip numarası bulunamadı: {tracking_number}")
    return c


@router.post("/", status_code=201)
def create_cargo(order_id: str, carrier: str, tracking_number: Optional[str] = None):
    if order_id not in ORDERS:
        raise HTTPException(404, f"Sipariş bulunamadı: {order_id}")
    tracking = tracking_number or _gen_tracking(carrier)
    now = datetime.now().isoformat(timespec="seconds")
    cargo = {
        "id": f"CRG-{str(uuid.uuid4())[:6].upper()}",
        "tracking_number": tracking,
        "order_id": order_id,
        "carrier": carrier,
        "status": "picked_up",
        "current_location": "Şube",
        "estimated_delivery": None,
        "is_delayed": False,
        "delay_reason": None,
        "last_update": now,
        "events": [
            {"status": "Kargo Kabul", "location": "Şube", "time": now}
        ],
    }
    CARGO[tracking] = cargo
    # Update the order with tracking number
    ORDERS[order_id]["cargo_tracking_number"] = tracking
    ORDERS[order_id]["status"] = "shipped"
    ORDERS[order_id]["updated_at"] = now
    return cargo


@router.put("/{tracking_number}/status")
def update_cargo_status(
    tracking_number: str,
    status: str,
    location: Optional[str] = None,
    is_delayed: Optional[bool] = None,
    delay_reason: Optional[str] = None,
):
    if status not in VALID_CARGO_STATUSES:
        raise HTTPException(400, f"Geçersiz kargo durumu: {status}")
    c = CARGO.get(tracking_number)
    if not c:
        raise HTTPException(404, f"Takip numarası bulunamadı: {tracking_number}")

    now = datetime.now().isoformat(timespec="seconds")
    c["status"] = status
    c["last_update"] = now
    if location:
        c["current_location"] = location
    if is_delayed is not None:
        c["is_delayed"] = is_delayed
    if delay_reason is not None:
        c["delay_reason"] = delay_reason

    c.setdefault("events", []).append({
        "status": status,
        "location": location or c.get("current_location", ""),
        "time": now,
    })

    # Sync order status
    if status == "delivered":
        order = ORDERS.get(c["order_id"])
        if order:
            order["status"] = "delivered"
            order["updated_at"] = now

    return c

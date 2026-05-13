import json

from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import datetime
from data.store import CARGO, ORDERS
from ai_client import AIClientError, ask_ai_json
import uuid, random, string

router = APIRouter()

VALID_CARGO_STATUSES = {
    "not_shipped", "picked_up", "in_transit",
    "out_for_delivery", "delivered", "delayed", "returned"
}

# ── Kargo Firması Performans Veritabanı ────────────────────────────────────────
# Gerçek projede bu veriler DB'den ya da harici API'den gelir.
# avg_delivery_days : ortalama teslimat süresi (iş günü)
# damage_rate       : hasar/kayıp oranı (0–1)
# price_per_kg      : kg başına ₺ ücret
# on_time_rate      : zamanında teslimat oranı (0–1)
# coverage          : şehir/bölge kapsamı puanı (0–1)
CARRIER_STATS: dict[str, dict] = {
    "Yurtiçi Kargo": {
        "avg_delivery_days": 2.1,
        "damage_rate":       0.020,
        "price_per_kg":      15.0,
        "on_time_rate":      0.92,
        "coverage":          0.95,
    },
    "Aras Kargo": {
        "avg_delivery_days": 1.8,
        "damage_rate":       0.030,
        "price_per_kg":      13.0,
        "on_time_rate":      0.89,
        "coverage":          0.90,
    },
    "MNG Kargo": {
        "avg_delivery_days": 2.4,
        "damage_rate":       0.015,
        "price_per_kg":      17.0,
        "on_time_rate":      0.94,
        "coverage":          0.88,
    },
    "PTT Kargo": {
        "avg_delivery_days": 3.2,
        "damage_rate":       0.010,
        "price_per_kg":      11.0,
        "on_time_rate":      0.85,
        "coverage":          0.99,
    },
    "Sürat Kargo": {
        "avg_delivery_days": 1.5,
        "damage_rate":       0.040,
        "price_per_kg":      19.0,
        "on_time_rate":      0.91,
        "coverage":          0.82,
    },
}


def _score_carrier(stats: dict, priority: str, weight_kg: float) -> float:
    """
    priority : "speed" | "cost" | "safety" | "balanced"
    Ağırlıklar priority'e göre değişir.
    Dönen değer yükseldikçe kargo daha iyi.
    """
    weights = {
        "speed":    {"speed": 0.50, "cost": 0.15, "safety": 0.20, "coverage": 0.15},
        "cost":     {"speed": 0.15, "cost": 0.55, "safety": 0.15, "coverage": 0.15},
        "safety":   {"speed": 0.15, "cost": 0.15, "safety": 0.55, "coverage": 0.15},
        "balanced": {"speed": 0.30, "cost": 0.30, "safety": 0.25, "coverage": 0.15},
    }.get(priority, {"speed": 0.30, "cost": 0.30, "safety": 0.25, "coverage": 0.15})

    # Her metriği 0–1 arasında normalize et (max değerlere göre)
    MAX_DAYS   = max(s["avg_delivery_days"] for s in CARRIER_STATS.values())
    MAX_PRICE  = max(s["price_per_kg"]      for s in CARRIER_STATS.values())

    speed_score    = 1 - (stats["avg_delivery_days"] / MAX_DAYS)   # az gün → yüksek puan
    cost_score     = 1 - (stats["price_per_kg"]      / MAX_PRICE)  # az fiyat → yüksek puan
    safety_score   = stats["on_time_rate"] * (1 - stats["damage_rate"])
    coverage_score = stats["coverage"]

    return (
        weights["speed"]    * speed_score    +
        weights["cost"]     * cost_score     +
        weights["safety"]   * safety_score   +
        weights["coverage"] * coverage_score
    )


def _gen_tracking(carrier: str) -> str:
    prefix = {
        "Yurtiçi Kargo": "YK",
        "Aras Kargo":     "ARS",
        "MNG Kargo":      "MNG",
        "PTT Kargo":      "PTT",
        "Sürat Kargo":    "SRT",
    }.get(carrier, "CRG")
    digits = ''.join(random.choices(string.digits, k=9))
    return f"{prefix}{digits}TR"


# ── GET /cargo/delayed  ────────────────────────────────────────────────────────
@router.get("/delayed")
def get_delayed():
    return [c for c in CARGO.values() if c.get("is_delayed")]


# ── GET /cargo/order/{order_id}  ──────────────────────────────────────────────
@router.get("/order/{order_id}")
def cargo_by_order(order_id: str):
    for c in CARGO.values():
        if c["order_id"] == order_id:
            return c
    raise HTTPException(404, f"Kargo bulunamadı (sipariş {order_id})")


# ── YENİ: GET /cargo/carriers/performance  ────────────────────────────────────
@router.get("/carriers/performance")
def carrier_performance():
    """Tüm kargo firmalarının performans metriklerini listeler."""
    result = []
    for name, stats in CARRIER_STATS.items():
        estimated_cost_10kg = round(stats["price_per_kg"] * 10, 2)
        result.append({
            "carrier":               name,
            "avg_delivery_days":     stats["avg_delivery_days"],
            "on_time_rate_pct":      round(stats["on_time_rate"] * 100, 1),
            "damage_rate_pct":       round(stats["damage_rate"]  * 100, 2),
            "price_per_kg":          stats["price_per_kg"],
            "estimated_cost_10kg":   estimated_cost_10kg,
            "coverage_pct":          round(stats["coverage"]     * 100, 1),
        })
    return sorted(result, key=lambda x: x["on_time_rate_pct"], reverse=True)


# ── YENİ: GET /cargo/recommend  ───────────────────────────────────────────────
def _local_carrier_recommendation(weight_kg: float, priority: str) -> dict:
    scored = []
    for name, stats in CARRIER_STATS.items():
        score = _score_carrier(stats, priority, weight_kg)
        estimated_cost = round(stats["price_per_kg"] * weight_kg, 2)
        scored.append({
            "carrier":           name,
            "score":             round(score, 4),
            "avg_delivery_days": stats["avg_delivery_days"],
            "on_time_rate_pct":  round(stats["on_time_rate"] * 100, 1),
            "damage_rate_pct":   round(stats["damage_rate"]  * 100, 2),
            "estimated_cost":    estimated_cost,
            "price_per_kg":      stats["price_per_kg"],
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    best = scored[0]

    return {
        "recommendation": {
            "carrier":           best["carrier"],
            "reason":            _explain(best, priority),
            "estimated_cost":    best["estimated_cost"],
            "avg_delivery_days": best["avg_delivery_days"],
            "on_time_rate_pct":  best["on_time_rate_pct"],
        },
        "priority_used": priority,
        "weight_kg":     weight_kg,
        "all_carriers":  scored,
    }


@router.get("/recommend")
async def recommend_carrier(
    weight_kg: float = 1.0,
    priority: str    = "balanced",   # speed | cost | safety | balanced
):
    """
    Ağırlık ve öncelik kriterine göre en uygun kargo firmasını önerir.

    - priority=speed   → en hızlı teslimat
    - priority=cost    → en ucuz seçenek
    - priority=safety  → en düşük hasar/gecikme oranı
    - priority=balanced → dengeli skor
    """
    if priority not in ("speed", "cost", "safety", "balanced"):
        raise HTTPException(400, "priority değeri: speed | cost | safety | balanced")
    if weight_kg <= 0:
        raise HTTPException(400, "weight_kg pozitif olmalı")

    local_result = _local_carrier_recommendation(weight_kg, priority)
    prompt = f"""Aşağıdaki kargo firması performans verileri, geçmiş gönderiler ve sipariş durumuna göre en uygun kargo firmasını seç.
Teslimat hızı, hasar/gecikme riski, fiyat ve öncelik kriterini birlikte değerlendir.

Paket ağırlığı: {weight_kg} kg
Öncelik: {priority}

Kargo performans verisi:
{json.dumps(CARRIER_STATS, ensure_ascii=False)}

Mevcut/past kargo kayıtları:
{json.dumps(list(CARGO.values()), ensure_ascii=False)}

Siparişler:
{json.dumps(list(ORDERS.values()), ensure_ascii=False)}

Yerel skor ön hesaplama:
{json.dumps(local_result, ensure_ascii=False)}

Yanıtı SADECE şu JSON formatında ver:
{{
  "recommendation": {{
    "carrier": "Firma adı",
    "reason": "Neden bu firma seçildi?",
    "estimated_cost": 150,
    "avg_delivery_days": 2.1,
    "on_time_rate_pct": 92,
    "ai_reason": "YZ'nin karar gerekçesi"
  }},
  "priority_used": "{priority}",
  "weight_kg": {weight_kg},
  "all_carriers": [
    {{
      "carrier": "Firma adı",
      "score": 0.85,
      "estimated_cost": 150,
      "avg_delivery_days": 2.1,
      "on_time_rate_pct": 92,
      "damage_rate_pct": 2
    }}
  ]
}}"""

    try:
        ai_result = await ask_ai_json(
            "Sen KOBİ'ler için akıllı kargo seçimi yapan bir yapay zekasın. Türkçe, net ve geçerli JSON döndür.",
            prompt,
        )
        ai_result["ai_powered"] = True
        ai_result["ai_request_attempted"] = True
        ai_result["source"] = "gemini"
        return ai_result
    except AIClientError as exc:
        return {
            **local_result,
            "ai_request_attempted": True,
            "ai_powered": False,
            "ai_unavailable": True,
            "source": "local_fallback",
            "ai_error": str(exc),
        }


def _explain(best: dict, priority: str) -> str:
    reasons = {
        "speed":    f"En hızlı teslimat: ortalama {best['avg_delivery_days']} iş günü.",
        "cost":     f"En düşük maliyet: {best['weight_kg'] if 'weight_kg' in best else ''}{best['price_per_kg']} ₺/kg.",
        "safety":   f"En güvenli: %{best['on_time_rate_pct']} zamanında teslimat, %{best['damage_rate_pct']} hasar oranı.",
        "balanced": (
            f"Dengeli skor birincisi: {best['avg_delivery_days']} günde teslimat, "
            f"%{best['on_time_rate_pct']} zamanında, {best['estimated_cost']} ₺ tahmini maliyet."
        ),
    }
    return reasons.get(priority, "En yüksek genel puan.")


# ── Mevcut endpoint'ler ────────────────────────────────────────────────────────
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
        "id":                f"CRG-{str(uuid.uuid4())[:6].upper()}",
        "tracking_number":   tracking,
        "order_id":          order_id,
        "carrier":           carrier,
        "status":            "picked_up",
        "current_location":  "Şube",
        "estimated_delivery": None,
        "is_delayed":        False,
        "delay_reason":      None,
        "last_update":       now,
        "events":            [{"status": "Kargo Kabul", "location": "Şube", "time": now}],
    }
    CARGO[tracking] = cargo
    ORDERS[order_id]["cargo_tracking_number"] = tracking
    ORDERS[order_id]["status"]     = "shipped"
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
    c["status"]      = status
    c["last_update"] = now
    if location:
        c["current_location"] = location
    if is_delayed is not None:
        c["is_delayed"] = is_delayed
    if delay_reason is not None:
        c["delay_reason"] = delay_reason

    c.setdefault("events", []).append({
        "status":   status,
        "location": location or c.get("current_location", ""),
        "time":     now,
    })

    if status == "delivered":
        order = ORDERS.get(c["order_id"])
        if order:
            order["status"]     = "delivered"
            order["updated_at"] = now

    return c





@router.get("/delay-email-draft/{tracking_number}")
def get_delay_email_draft(tracking_number: str):
    c = CARGO.get(tracking_number)
    if not c:
        raise HTTPException(404, f"Takip numarası bulunamadı: {tracking_number}")
    if not c.get("is_delayed"):
        raise HTTPException(400, "Bu kargo gecikmeli değil.")

    order = ORDERS.get(c["order_id"])
    if not order:
        raise HTTPException(404, "Sipariş bulunamadı.")

    customer_name = order["customer_name"]
    delay_reason = c.get("delay_reason") or "beklenmedik bir durum"
    estimated = c.get("estimated_delivery") or "en kısa sürede"
    carrier = c["carrier"]
    tracking = c["tracking_number"]

    subject = f"Siparişiniz Hakkında Bilgilendirme - {c['order_id']}"
    body = f"""Sayın {customer_name},

{c['order_id']} numaralı siparişinizin kargosunda ({carrier} / {tracking}) {delay_reason} nedeniyle gecikme yaşandığını bildirmek isteriz.

Tahmini teslimat tarihiniz: {estimated}

Bu gecikmeden dolayı özür diler, anlayışınız için teşekkür ederiz. Kargo takibinizi {tracking} numarasıyla yapabilirsiniz.

Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyiniz.

Saygılarımızla"""

    return {
        "tracking_number": tracking,
        "order_id": c["order_id"],
        "customer_name": customer_name,
        "customer_email": order.get("customer_email", ""),
        "delay_reason": delay_reason,
        "subject": subject,
        "body": body,
    }
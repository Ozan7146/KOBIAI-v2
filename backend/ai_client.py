import asyncio
import json
import os
import random
import re
from urllib.parse import quote
import httpx

# Google AI Studio / Gemini: https://ai.google.dev/gemini-api/docs
# 1.5-flash: ücretsiz kotada 2.0’a göre genelde daha stabil; 2.0 istiyorsanız GEMINI_MODEL ile değiştirin.
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
_MAX_RETRIES = max(1, int(os.getenv("GEMINI_MAX_RETRIES", "6")))
_REQUEST_GAP_SEC = max(0.0, float(os.getenv("GEMINI_REQUEST_GAP_SECONDS", "0.4")))

_gemini_lock = asyncio.Lock()


class AIClientError(Exception):
    pass


def gemini_api_key() -> str:
    """Önce GEMINI_API_KEY, yoksa GOOGLE_API_KEY (Google AI Studio ile aynı anahtar)."""
    return (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")).strip()


def parse_json_from_text(text: str) -> dict:
    clean = re.sub(r"```json|```", "", text).strip()
    return json.loads(clean)


def gemini_error_message(resp: httpx.Response) -> str:
    try:
        body = resp.json()
        err = body.get("error")
        if isinstance(err, dict):
            return err.get("message") or resp.text
        return resp.text
    except ValueError:
        return resp.text


def _retry_after_seconds(resp: httpx.Response) -> float | None:
    ra = resp.headers.get("Retry-After")
    if ra:
        try:
            return float(ra)
        except ValueError:
            pass
    try:
        body = resp.json()
        msg = (body.get("error") or {}).get("message") or ""
    except ValueError:
        msg = resp.text or ""
    m = re.search(r"retry in ([0-9.]+)\s*s", msg, re.I)
    if m:
        return float(m.group(1))
    return None


def _extract_gemini_text(data: dict) -> str:
    cands = data.get("candidates") or []
    if not cands:
        fb = data.get("promptFeedback")
        if fb:
            raise AIClientError(f"Gemini yanıt üretmedi: {json.dumps(fb, ensure_ascii=False)[:500]}")
        raise AIClientError(f"Gemini yanıtında aday yok: {json.dumps(data, ensure_ascii=False)[:500]}")

    parts = (cands[0].get("content") or {}).get("parts") or []
    texts = [p.get("text", "") for p in parts if isinstance(p, dict) and p.get("text")]
    if texts:
        return "\n".join(texts)

    raise AIClientError(f"Gemini yanıtında metin bulunamadı: {json.dumps(data, ensure_ascii=False)[:500]}")


async def ask_gemini_text(system: str, prompt: str, max_tokens: int = 1200) -> str:
    key = gemini_api_key()
    if not key:
        raise AIClientError("GEMINI_API_KEY (veya GOOGLE_API_KEY) ayarlanmadı. .env dosyasına ekleyin.")

    model = GEMINI_MODEL.strip() or "gemini-1.5-flash"
    safe_model = quote(model, safe="")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{safe_model}:generateContent"
    payload: dict = {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": max_tokens},
    }
    headers = {"Content-Type": "application/json"}

    async with _gemini_lock:
        last_error = ""
        async with httpx.AsyncClient(timeout=90) as client:
            for attempt in range(_MAX_RETRIES):
                try:
                    resp = await client.post(url, headers=headers, json=payload, params={"key": key})
                except httpx.RequestError as exc:
                    raise AIClientError(f"Gemini servisine ulaşılamadı: {exc}") from exc

                if resp.status_code == 200:
                    text = _extract_gemini_text(resp.json())
                    if _REQUEST_GAP_SEC:
                        await asyncio.sleep(_REQUEST_GAP_SEC)
                    return text

                last_error = gemini_error_message(resp)

                if resp.status_code in (429, 503):
                    parsed = _retry_after_seconds(resp)
                    if parsed is not None:
                        wait = min(90.0, parsed + random.uniform(0.15, 0.55))
                    else:
                        wait = min(45.0, (2**attempt) * 0.85 + random.uniform(0, 0.35))
                    await asyncio.sleep(wait)
                    continue

                raise AIClientError(last_error)

        raise AIClientError(
            "Gemini hız veya kota sınırı: birkaç saniye sonra tekrar denendi, yine yetmedi. "
            "Dashboard aynı anda birden fazla analiz isteği gönderdiğinde ücretsiz kotada bu olabilir. "
            f"Ayrıntı: {last_error[:500]}"
        )


async def ask_gemini_json(system: str, prompt: str, max_tokens: int = 1200) -> dict:
    text = await ask_gemini_text(system, prompt, max_tokens=max_tokens)
    try:
        return parse_json_from_text(text)
    except json.JSONDecodeError as exc:
        raise AIClientError(f"Gemini geçerli JSON döndürmedi: {text[:500]}") from exc

import asyncio
import json
import os
import random
import re

import httpx

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

MAX_RETRIES = max(1, int(os.getenv("GROQ_MAX_RETRIES", "5")))
REQUEST_TIMEOUT = int(os.getenv("GROQ_REQUEST_TIMEOUT", "60"))

_groq_lock = asyncio.Lock()


class AIClientError(Exception):
    pass


def parse_json_from_text(text: str) -> dict:
    clean = re.sub(r"```json|```", "", text).strip()
    return json.loads(clean)


async def ask_ai_text(system: str, prompt: str, max_tokens: int = 1200) -> str:
    if not GROQ_API_KEY:
        raise AIClientError("GROQ_API_KEY bulunamadı.")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_MODEL,
        "temperature": 0.3,
        "max_tokens": max_tokens,
        "messages": [
            {
                "role": "system",
                "content": system,
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    }

    async with _groq_lock:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            last_error = ""

            for attempt in range(MAX_RETRIES):
                try:
                    resp = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers=headers,
                        json=payload,
                    )

                except httpx.RequestError as exc:
                    raise AIClientError(
                        f"Groq bağlantı hatası: {exc}"
                    ) from exc

                if resp.status_code == 200:
                    data = resp.json()

                    try:
                        return data["choices"][0]["message"]["content"]
                    except Exception:
                        raise AIClientError(
                            f"Groq response parse hatası: {data}"
                        )

                last_error = resp.text

                if resp.status_code in (429, 500, 502, 503):
                    wait = min(
                        20,
                        (2 ** attempt) + random.uniform(0.2, 1.2)
                    )
                    await asyncio.sleep(wait)
                    continue

                raise AIClientError(last_error)

    raise AIClientError(
        f"Groq AI isteği başarısız: {last_error[:500]}"
    )


async def ask_ai_json(system: str, prompt: str, max_tokens: int = 1200) -> dict:
    text = await ask_ai_text(
        system,
        prompt,
        max_tokens=max_tokens,
    )

    try:
        return parse_json_from_text(text)

    except json.JSONDecodeError as exc:
        raise AIClientError(
            f"AI geçerli JSON döndürmedi:\n{text[:500]}"
        ) from exc
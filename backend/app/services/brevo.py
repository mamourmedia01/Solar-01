"""
Brevo (formerly Sendinblue) transactional email delivery.
"""
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

BREVO_BASE = "https://api.brevo.com/v3"

SENDER = {"name": "Solar-01", "email": "noreply@solar-01.io"}


async def send_email(
    to_email: str,
    to_name: str,
    subject: str,
    body: str,
    reply_to: Optional[str] = None,
) -> Dict[str, Any]:
    """Send a plain-text transactional email via Brevo."""
    payload: Dict[str, Any] = {
        "sender": SENDER,
        "to": [{"email": to_email, "name": to_name}],
        "subject": subject,
        "textContent": body,
    }
    if reply_to:
        payload["replyTo"] = {"email": reply_to}

    headers = {
        "api-key": settings.BREVO_API_KEY,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(f"{BREVO_BASE}/smtp/email", json=payload, headers=headers)
        r.raise_for_status()
        return r.json()

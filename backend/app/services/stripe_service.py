"""
Stripe subscription billing.
"""
import stripe
from typing import Dict, Any
from app.core.config import settings
from app.models.subscription import TIER_PRICES

stripe.api_key = settings.STRIPE_SECRET_KEY

TIER_PRICE_IDS = {
    "pro":          settings.STRIPE_PRICE_PRO,
    "professional": settings.STRIPE_PRICE_PROFESSIONAL,
    "enterprise":   settings.STRIPE_PRICE_ENTERPRISE,
}


async def create_checkout_session(
    org_id: str,
    customer_email: str,
    tier: str,
    success_url: str,
    cancel_url: str,
) -> str:
    """Create a Stripe Checkout session and return the URL."""
    price_id = TIER_PRICE_IDS.get(tier)
    if not price_id:
        raise ValueError(f"Unknown tier: {tier}")

    session = stripe.checkout.Session.create(
        mode="subscription",
        customer_email=customer_email,
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=success_url + "?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=cancel_url,
        metadata={"org_id": org_id, "tier": tier},
        subscription_data={"metadata": {"org_id": org_id}},
    )
    return session.url


async def create_portal_session(stripe_customer_id: str, return_url: str) -> str:
    session = stripe.billing_portal.Session.create(
        customer=stripe_customer_id,
        return_url=return_url,
    )
    return session.url


def handle_webhook(payload: bytes, sig_header: str) -> Dict[str, Any]:
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        raise ValueError("Invalid Stripe signature")
    return event

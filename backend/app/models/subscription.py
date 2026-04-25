from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

TIER_LIMITS = {
    "free":         {"leads": 50,    "monthly_searches": 5},
    "pro":          {"leads": 500,   "monthly_searches": 50},
    "professional": {"leads": 2000,  "monthly_searches": 200},
    "enterprise":   {"leads": 99999, "monthly_searches": 9999},
}

TIER_PRICES = {
    "pro":          {"monthly": 9900,   "label": "Pro — £99/mo"},
    "professional": {"monthly": 29900,  "label": "Professional — £299/mo"},
    "enterprise":   {"monthly": None,   "label": "Enterprise — Contact us"},
}


class CheckoutRequest(BaseModel):
    tier: str  # pro | professional | enterprise
    success_url: str
    cancel_url: str


class PortalRequest(BaseModel):
    return_url: str


class StripeWebhookMeta(BaseModel):
    stripe_signature: str

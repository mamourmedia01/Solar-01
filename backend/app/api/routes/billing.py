from fastapi import APIRouter, Depends, HTTPException, Request
from app.core.auth import get_current_user
from app.core.database import get_db
from app.services.stripe_service import (
    create_checkout_session,
    create_portal_session,
    handle_webhook,
)
from app.models.subscription import TIER_LIMITS

router = APIRouter()


@router.post("/checkout")
async def checkout(body: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]})
    tier = body.get("tier")
    if tier not in ("pro", "professional", "enterprise"):
        raise HTTPException(status_code=400, detail="Invalid tier")
    url = await create_checkout_session(
        org_id=current_user["org_id"],
        customer_email=user["email"],
        tier=tier,
        success_url=body.get("success_url", "http://localhost:3000/billing?success=1"),
        cancel_url=body.get("cancel_url", "http://localhost:3000/billing"),
    )
    return {"checkout_url": url}


@router.post("/portal")
async def portal(body: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    org = await db.organizations.find_one({"_id": current_user["org_id"]})
    if not org or not org.get("stripe_customer_id"):
        raise HTTPException(status_code=400, detail="No active subscription")
    url = await create_portal_session(
        stripe_customer_id=org["stripe_customer_id"],
        return_url=body.get("return_url", "http://localhost:3000/billing"),
    )
    return {"portal_url": url}


@router.post("/webhook")
async def webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = handle_webhook(payload, sig)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    db = get_db()
    etype = event["type"]

    if etype == "checkout.session.completed":
        session = event["data"]["object"]
        org_id = session.get("metadata", {}).get("org_id")
        tier = session.get("metadata", {}).get("tier", "pro")
        limits = TIER_LIMITS.get(tier, TIER_LIMITS["pro"])
        if org_id:
            await db.organizations.update_one(
                {"_id": org_id},
                {"$set": {
                    "stripe_customer_id": session.get("customer"),
                    "stripe_subscription_id": session.get("subscription"),
                    "subscription_tier": tier,
                    "subscription_status": "active",
                    "leads_limit": limits["leads"],
                }},
            )

    elif etype in ("customer.subscription.deleted", "customer.subscription.paused"):
        sub = event["data"]["object"]
        await db.organizations.update_one(
            {"stripe_subscription_id": sub["id"]},
            {"$set": {"subscription_status": "inactive", "subscription_tier": "free"}},
        )

    return {"received": True}

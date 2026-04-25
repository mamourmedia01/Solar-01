from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from app.core.auth import get_current_user
from app.core.database import get_db
from app.services.openai_email import generate_email
from app.services.brevo import send_email

router = APIRouter()


@router.post("/{lead_id}/generate")
async def generate(
    lead_id: str,
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    lead = await db.leads.find_one({"_id": lead_id, "org_id": current_user["org_id"]})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    style = body.get("style", "direct")
    result = await generate_email(lead, style)
    return result


@router.post("/{lead_id}/send")
async def send(
    lead_id: str,
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    lead = await db.leads.find_one({"_id": lead_id, "org_id": current_user["org_id"]})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    contact = lead.get("contact", {})
    to_email = contact.get("email") or body.get("to_email")
    if not to_email:
        raise HTTPException(status_code=400, detail="No contact email for this lead")

    subject = body.get("subject", "Solar opportunity for your property")
    email_body = body.get("body", "")
    style = body.get("style", "direct")

    result = await send_email(
        to_email=to_email,
        to_name=contact.get("name", ""),
        subject=subject,
        body=email_body,
    )

    record = {
        "sent_at": datetime.utcnow(),
        "subject": subject,
        "body": email_body,
        "style": style,
        "status": "sent",
        "brevo_message_id": result.get("messageId"),
    }
    await db.leads.update_one(
        {"_id": lead_id},
        {"$push": {"outreach": record}},
    )
    return {"status": "sent", "message_id": result.get("messageId")}


@router.get("/{lead_id}/history")
async def history(lead_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    lead = await db.leads.find_one(
        {"_id": lead_id, "org_id": current_user["org_id"]},
        {"outreach": 1},
    )
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"outreach": lead.get("outreach", [])}

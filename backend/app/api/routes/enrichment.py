from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from datetime import datetime
from app.core.auth import get_current_user
from app.core.database import get_db
from app.services import companies_house, apollo, historic_england

router = APIRouter()


async def _run_enrichment(lead_id: str, org_id: str):
    db = get_db()
    lead = await db.leads.find_one({"_id": lead_id, "org_id": org_id})
    if not lead:
        return

    updates: dict = {"updated_at": datetime.utcnow()}

    # Companies House
    try:
        company_data = await companies_house.enrich_lead_company(
            lead.get("address", ""), lead.get("postcode", "")
        )
        if company_data:
            updates["company"] = company_data
    except Exception:
        pass

    # Apollo.io contact discovery
    try:
        company_name = updates.get("company", {}).get("name") or lead.get("address", "")
        contact_data = await apollo.find_contact(company_name)
        if contact_data:
            updates["contact"] = contact_data
    except Exception:
        pass

    # Historic England conservation area check
    try:
        conservation = await historic_england.check_conservation_area(
            lead.get("lat", 0), lead.get("lng", 0)
        )
        updates["conservation_risk"] = conservation["conservation_risk"]
        updates["conservation_area_name"] = conservation.get("conservation_area_name")
    except Exception:
        pass

    # Update enrichment status
    company_done = bool(updates.get("company", {}).get("name"))
    contact_done = bool(updates.get("contact", {}).get("email"))
    if company_done and contact_done:
        updates["enrichment_status"] = "complete"
    elif company_done or contact_done:
        updates["enrichment_status"] = "partial"

    await db.leads.update_one({"_id": lead_id}, {"$set": updates})


@router.post("/{lead_id}/enrich")
async def enrich_lead(
    lead_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    lead = await db.leads.find_one({"_id": lead_id, "org_id": current_user["org_id"]})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    background_tasks.add_task(_run_enrichment, lead_id, current_user["org_id"])
    return {"status": "enrichment_started"}


@router.post("/batch-enrich")
async def batch_enrich(
    body: dict,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    lead_ids = body.get("lead_ids", [])
    for lead_id in lead_ids[:20]:  # cap at 20 per batch
        background_tasks.add_task(_run_enrichment, lead_id, current_user["org_id"])
    return {"status": "batch_enrichment_started", "count": len(lead_ids[:20])}

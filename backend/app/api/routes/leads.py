from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.lead import LeadFilter
from app.services import os_places, os_ngd, roi as roi_service

router = APIRouter()


async def _discover_pipeline(org_id: str, postcode: str, min_area: float = 500.0):
    """Background task: fetch buildings from OS APIs and store qualifying leads."""
    db = get_db()
    addresses = await os_places.search_by_postcode(postcode)
    for addr in addresses:
        if not os_places.is_non_domestic(addr.get("classification", "")):
            continue
        uprn = addr.get("uprn")
        feature = await os_ngd.get_building_by_uprn(uprn) if uprn else None
        if feature:
            attrs = os_ngd.extract_roof_attributes(feature)
        else:
            attrs = {"area_m2": 0.0, "height_m": None, "orientation_deg": None,
                     "polygon": None, "low_confidence": True}

        filter_passed = os_ngd.passes_solar_filter(attrs, min_area)
        roi_data = roi_service.calculate_roi(attrs["area_m2"]) if attrs["area_m2"] > 0 else {}

        lead_doc = {
            "_id": str(ObjectId()),
            "org_id": org_id,
            "uprn": uprn,
            "address": addr["address"],
            "postcode": addr["postcode"],
            "lat": addr["lat"],
            "lng": addr["lng"],
            "geometry": {
                "polygon": attrs.get("polygon"),
                "area_m2": attrs.get("area_m2", 0),
                "height_m": attrs.get("height_m"),
                "orientation_deg": attrs.get("orientation_deg"),
                "pitch_deg": 0.0,
            },
            "low_confidence": attrs.get("low_confidence", True),
            "filter_passed": filter_passed,
            "roi": roi_data.model_dump() if hasattr(roi_data, "model_dump") else {},
            "enrichment_status": "pending",
            "company": {},
            "contact": {},
            "conservation_risk": False,
            "outreach": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        # Upsert by UPRN + org to avoid duplicates
        await db.leads.update_one(
            {"org_id": org_id, "uprn": uprn or lead_doc["_id"]},
            {"$setOnInsert": lead_doc},
            upsert=True,
        )


@router.post("/discover")
async def discover_leads(
    body: dict,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    postcode = body.get("postcode", "").strip()
    min_area = float(body.get("min_area", 500.0))
    if not postcode:
        raise HTTPException(status_code=400, detail="postcode required")
    background_tasks.add_task(
        _discover_pipeline, current_user["org_id"], postcode, min_area
    )
    return {"status": "discovery_started", "postcode": postcode}


@router.get("/")
async def list_leads(
    postcode: Optional[str] = None,
    enrichment_status: Optional[str] = None,
    conservation_risk: Optional[bool] = None,
    low_confidence: Optional[bool] = None,
    filter_passed: Optional[bool] = None,
    min_area: float = 0.0,
    sort_by: str = "created_at",
    sort_dir: int = -1,
    page: int = 1,
    page_size: int = 50,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    query: dict = {"org_id": current_user["org_id"]}
    if postcode:
        query["postcode"] = {"$regex": postcode, "$options": "i"}
    if enrichment_status:
        query["enrichment_status"] = enrichment_status
    if conservation_risk is not None:
        query["conservation_risk"] = conservation_risk
    if low_confidence is not None:
        query["low_confidence"] = low_confidence
    if filter_passed is not None:
        query["filter_passed"] = filter_passed
    if min_area > 0:
        query["geometry.area_m2"] = {"$gte": min_area}

    skip = (page - 1) * page_size
    cursor = db.leads.find(query).sort(sort_by, sort_dir).skip(skip).limit(page_size)
    leads = await cursor.to_list(length=page_size)
    total = await db.leads.count_documents(query)
    for lead in leads:
        lead["id"] = str(lead.pop("_id"))
    return {"leads": leads, "total": total, "page": page, "page_size": page_size}


@router.get("/{lead_id}")
async def get_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    lead = await db.leads.find_one({"_id": lead_id, "org_id": current_user["org_id"]})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead["id"] = str(lead.pop("_id"))
    return lead


@router.patch("/{lead_id}")
async def update_lead(lead_id: str, body: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    body.pop("_id", None)
    body.pop("org_id", None)
    body["updated_at"] = datetime.utcnow()
    result = await db.leads.update_one(
        {"_id": lead_id, "org_id": current_user["org_id"]},
        {"$set": body},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"status": "updated"}


@router.delete("/{lead_id}")
async def delete_lead(lead_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.leads.delete_one({"_id": lead_id, "org_id": current_user["org_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"status": "deleted"}

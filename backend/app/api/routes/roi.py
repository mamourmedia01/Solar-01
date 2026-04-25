from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.core.database import get_db
from app.services.roi import calculate_roi

router = APIRouter()


@router.post("/calculate")
async def calculate(body: dict, current_user: dict = Depends(get_current_user)):
    roof_area_m2 = float(body.get("roof_area_m2", 0))
    if roof_area_m2 <= 0:
        raise HTTPException(status_code=400, detail="roof_area_m2 must be positive")
    result = calculate_roi(
        roof_area_m2=roof_area_m2,
        electricity_rate=float(body.get("electricity_rate", 0.28)),
        export_rate=float(body.get("export_rate", 0.15)),
        export_fraction=float(body.get("export_fraction", 0.5)),
        install_cost_per_kw=float(body.get("install_cost_per_kw", 1000.0)),
        sun_hours=float(body.get("sun_hours", 1100.0)),
    )
    return result.model_dump()


@router.patch("/leads/{lead_id}/roi")
async def update_lead_roi(
    lead_id: str,
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    lead = await db.leads.find_one({"_id": lead_id, "org_id": current_user["org_id"]})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    area = lead.get("geometry", {}).get("area_m2", 0)
    roi_data = calculate_roi(
        roof_area_m2=area,
        electricity_rate=float(body.get("electricity_rate", 0.28)),
        export_rate=float(body.get("export_rate", 0.15)),
        export_fraction=float(body.get("export_fraction", 0.5)),
        install_cost_per_kw=float(body.get("install_cost_per_kw", 1000.0)),
        sun_hours=float(body.get("sun_hours", 1100.0)),
    )
    await db.leads.update_one(
        {"_id": lead_id},
        {"$set": {"roi": roi_data.model_dump()}},
    )
    return roi_data.model_dump()

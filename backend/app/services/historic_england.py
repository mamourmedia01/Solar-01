"""
Historic England ArcGIS REST API — conservation area risk check.
No API key required.
"""
import httpx
from typing import Optional, Dict, Any

CONSERVATION_AREAS_URL = (
    "https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services"
    "/Conservation_Areas/FeatureServer/0/query"
)


async def check_conservation_area(lat: float, lng: float) -> Dict[str, Any]:
    """Return conservation area info if the point falls within one."""
    params = {
        "geometry": f"{lng},{lat}",
        "geometryType": "esriGeometryPoint",
        "inSR": "4326",
        "spatialRel": "esriSpatialRelIntersects",
        "outFields": "Name,ListEntry,Grade",
        "returnGeometry": "false",
        "f": "json",
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(CONSERVATION_AREAS_URL, params=params)
            r.raise_for_status()
            data = r.json()
    except Exception:
        return {"conservation_risk": False, "conservation_area_name": None}

    features = data.get("features", [])
    if features:
        attrs = features[0].get("attributes", {})
        return {
            "conservation_risk": True,
            "conservation_area_name": attrs.get("Name") or attrs.get("ListEntry"),
        }
    return {"conservation_risk": False, "conservation_area_name": None}

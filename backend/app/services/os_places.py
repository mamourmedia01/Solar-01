"""
OS Places API / AddressBase Premium — postcode search and UPRN lookup.
"""
import httpx
from typing import List, Dict, Any
from app.core.config import settings

PLACES_BASE = "https://api.os.uk/search/places/v1"


async def search_by_postcode(postcode: str) -> List[Dict[str, Any]]:
    """Return all addresses/UPRNs for a postcode."""
    url = f"{PLACES_BASE}/postcode"
    params = {
        "postcode": postcode.replace(" ", "").upper(),
        "key": settings.ADDRESSBASE_API_KEY or settings.OS_API_KEY,
        "dataset": "DPA,LPI",
        "maxresults": 200,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        data = r.json()
    results = data.get("results", [])
    addresses = []
    for item in results:
        dpa = item.get("DPA") or item.get("LPI") or {}
        lat = float(dpa.get("LAT", 0))
        lng = float(dpa.get("LNG", 0))
        if lat and lng:
            addresses.append({
                "uprn": dpa.get("UPRN"),
                "address": dpa.get("ADDRESS") or dpa.get("LPI_LOGICAL_STATUS_CODE"),
                "postcode": dpa.get("POSTCODE", postcode),
                "lat": lat,
                "lng": lng,
                "classification": dpa.get("CLASSIFICATION_CODE", ""),
            })
    return addresses


def is_non_domestic(classification_code: str) -> bool:
    """Filter to non-domestic buildings only (commercial, industrial)."""
    if not classification_code:
        return True  # unknown — include for manual review
    domestic_prefixes = ("R",)  # R = Residential in AddressBase
    return not classification_code.startswith(domestic_prefixes)

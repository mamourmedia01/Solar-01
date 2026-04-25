"""
Companies House REST API — company search, profile, and director lookup.
Uses OAuth 2.0 client credentials flow.
"""
import httpx
from typing import Optional, Dict, Any, List
from app.core.config import settings

CH_BASE = "https://api.company-information.service.gov.uk"
CH_AUTH = "https://account.companieshouse.gov.uk/oauth2/token"

_token_cache: Dict[str, Any] = {}


async def _get_token() -> str:
    import time
    if _token_cache.get("expires_at", 0) > time.time() + 60:
        return _token_cache["token"]
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            CH_AUTH,
            data={"grant_type": "client_credentials"},
            auth=(settings.COMPANIES_HOUSE_CLIENT_ID, settings.COMPANIES_HOUSE_CLIENT_SECRET),
        )
        r.raise_for_status()
        data = r.json()
    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = time.time() + data.get("expires_in", 3600)
    return _token_cache["token"]


async def _ch_get(path: str) -> Dict[str, Any]:
    token = await _get_token()
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(
            f"{CH_BASE}{path}",
            headers={"Authorization": f"Bearer {token}"},
        )
        if r.status_code == 404:
            return {}
        r.raise_for_status()
        return r.json()


async def search_company(query: str, postcode: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Search for a company by name or postcode, return best match."""
    params = f"?q={query}&items_per_page=5"
    data = await _ch_get(f"/search/companies{params}")
    items = data.get("items", [])
    if not items:
        return None
    # Prefer active companies
    for item in items:
        if item.get("company_status") == "active":
            return item
    return items[0]


async def get_company_profile(company_number: str) -> Dict[str, Any]:
    return await _ch_get(f"/company/{company_number}")


async def get_directors(company_number: str) -> List[Dict[str, Any]]:
    data = await _ch_get(f"/company/{company_number}/officers?register_type=directors&items_per_page=10")
    officers = data.get("items", [])
    directors = []
    for o in officers:
        if o.get("resigned_on"):
            continue
        directors.append({
            "name": o.get("name", ""),
            "role": o.get("officer_role", "director"),
            "appointed_on": o.get("appointed_on"),
        })
    return directors


async def enrich_lead_company(address: str, postcode: str) -> Dict[str, Any]:
    """Full enrichment: search → profile → directors."""
    company = await search_company(address, postcode)
    if not company:
        return {}
    number = company.get("company_number", "")
    profile = await get_company_profile(number) if number else {}
    directors = await get_directors(number) if number else []
    sic_codes = [s.get("sic_code", "") for s in profile.get("sic_codes", [])]
    return {
        "name": profile.get("company_name") or company.get("title", ""),
        "registration_number": number,
        "sic_codes": sic_codes,
        "directors": directors,
        "address": profile.get("registered_office_address", {}).get("address_line_1", ""),
        "incorporated_date": profile.get("date_of_creation"),
    }

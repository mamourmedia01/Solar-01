"""
Apollo.io People Search API — find facilities managers and decision-makers.
"""
import httpx
from typing import Optional, Dict, Any
from app.core.config import settings

APOLLO_BASE = "https://api.apollo.io/v1"


async def find_contact(
    company_name: str,
    domain: Optional[str] = None,
    titles: Optional[list] = None,
) -> Optional[Dict[str, Any]]:
    """Search for a facilities/operations decision-maker at a company."""
    if titles is None:
        titles = [
            "Facilities Manager",
            "Head of Facilities",
            "Operations Director",
            "Property Manager",
            "Sustainability Manager",
            "Chief Operating Officer",
            "Managing Director",
        ]
    payload = {
        "api_key": settings.APOLLO_API_KEY,
        "q_organization_name": company_name,
        "person_titles": titles,
        "per_page": 1,
    }
    if domain:
        payload["q_organization_domains"] = [domain]

    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(f"{APOLLO_BASE}/mixed_people/search", json=payload)
        if r.status_code in (401, 403, 429):
            return None
        r.raise_for_status()
        data = r.json()

    people = data.get("people", [])
    if not people:
        return None

    person = people[0]
    return {
        "name": f"{person.get('first_name', '')} {person.get('last_name', '')}".strip(),
        "title": person.get("title", ""),
        "email": person.get("email"),
        "phone": person.get("phone_numbers", [{}])[0].get("sanitized_number") if person.get("phone_numbers") else None,
        "linkedin": person.get("linkedin_url"),
    }

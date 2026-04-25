"""
AI email generator using OpenAI.
"""
from openai import AsyncOpenAI
from typing import Dict, Any
from app.core.config import settings

_client = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


STYLE_PROMPTS = {
    "direct": "Write a direct, urgent sales email. Lead with the financial opportunity and deadline.",
    "educational": "Write an educational email that explains solar benefits first, then the ROI opportunity.",
    "roi_focused": "Write a concise ROI-focused email leading with the exact savings figure and payback period.",
}


async def generate_email(lead_data: Dict[str, Any], style: str = "direct") -> Dict[str, str]:
    """Generate a personalised outreach email for a lead."""
    company = lead_data.get("company", {})
    contact = lead_data.get("contact", {})
    roi = lead_data.get("roi", {})
    geometry = lead_data.get("geometry", {})

    style_instruction = STYLE_PROMPTS.get(style, STYLE_PROMPTS["direct"])

    prompt = f"""You are a senior solar sales consultant writing to a UK commercial property owner.

Lead details:
- Company: {company.get("name", "the company")}
- Contact: {contact.get("name", "the owner")}, {contact.get("title", "")}
- Address: {lead_data.get("address", "")}
- Roof area: {geometry.get("area_m2", 0):.0f} m²
- Proposed system: {roi.get("system_kw", 0):.0f} kW
- Annual output: {roi.get("annual_output_kwh", 0):,.0f} kWh
- Year 1 savings: £{roi.get("savings_year_1", 0):,.0f}
- 25-year savings: £{roi.get("savings_25yr", 0):,.0f}
- Payback period: {roi.get("payback_years", 0):.1f} years
- Conservation area risk: {lead_data.get("conservation_risk", False)}

Style instruction: {style_instruction}

Write a plain-text email (no HTML). Include a subject line on the first line prefixed with "Subject: ".
Keep it under 200 words. Be specific about this property's numbers. Do not use generic filler."""

    client = get_client()
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=400,
        temperature=0.7,
    )

    content = response.choices[0].message.content.strip()
    lines = content.split("\n", 1)
    subject = lines[0].replace("Subject:", "").strip() if lines[0].startswith("Subject:") else "Solar opportunity for your property"
    body = lines[1].strip() if len(lines) > 1 else content

    return {"subject": subject, "body": body, "style": style}

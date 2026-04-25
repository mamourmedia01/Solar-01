from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class RoofGeometry(BaseModel):
    polygon: Optional[Dict[str, Any]] = None  # GeoJSON Polygon
    area_m2: float = 0.0
    orientation_deg: Optional[float] = None
    height_m: Optional[float] = None
    pitch_deg: float = 0.0


class CompanyInfo(BaseModel):
    name: Optional[str] = None
    registration_number: Optional[str] = None
    sic_codes: List[str] = []
    directors: List[Dict[str, str]] = []
    address: Optional[str] = None
    incorporated_date: Optional[str] = None


class ContactInfo(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None


class ROIData(BaseModel):
    system_kw: float = 0.0
    annual_output_kwh: float = 0.0
    savings_year_1: float = 0.0
    savings_25yr: float = 0.0
    install_cost: float = 0.0
    payback_years: float = 0.0
    electricity_rate: float = 0.28  # £/kWh
    export_rate: float = 0.15       # £/kWh Smart Export Guarantee
    export_fraction: float = 0.5
    sun_hours_per_year: float = 1100.0


class OutreachRecord(BaseModel):
    sent_at: datetime
    subject: str
    body: str
    style: str  # direct | educational | roi_focused
    status: str  # sent | bounced | opened | replied
    brevo_message_id: Optional[str] = None


class Lead(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    org_id: str
    uprn: Optional[str] = None
    address: str
    postcode: str
    lat: float
    lng: float
    geometry: RoofGeometry = Field(default_factory=RoofGeometry)
    low_confidence: bool = False
    filter_passed: bool = False
    company: CompanyInfo = Field(default_factory=CompanyInfo)
    contact: ContactInfo = Field(default_factory=ContactInfo)
    conservation_risk: bool = False
    conservation_area_name: Optional[str] = None
    roi: ROIData = Field(default_factory=ROIData)
    outreach: List[OutreachRecord] = []
    enrichment_status: str = "pending"  # pending | partial | complete
    notes: Optional[str] = None
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}


class LeadCreate(BaseModel):
    address: str
    postcode: str
    lat: float
    lng: float


class LeadFilter(BaseModel):
    postcode: Optional[str] = None
    min_area: float = 500.0
    enrichment_status: Optional[str] = None
    conservation_risk: Optional[bool] = None
    low_confidence: Optional[bool] = None
    sort_by: str = "created_at"
    sort_dir: int = -1
    page: int = 1
    page_size: int = 50

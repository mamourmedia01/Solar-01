from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class Organization(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    slug: str
    subscription_tier: str = "free"  # free | pro | professional | enterprise
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    subscription_status: str = "inactive"  # active | inactive | past_due | canceled
    leads_limit: int = 50
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}


class AuditLog(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    org_id: str
    user_id: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    metadata: dict = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}

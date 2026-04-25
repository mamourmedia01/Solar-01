from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class User(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    org_id: str
    email: EmailStr
    name: str
    hashed_password: Optional[str] = None
    google_id: Optional[str] = None
    role: str = "member"  # admin | member | viewer
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    org_name: Optional[str] = None  # creates org if provided


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

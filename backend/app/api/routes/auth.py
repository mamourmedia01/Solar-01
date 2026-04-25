from fastapi import APIRouter, HTTPException, status
from app.core.auth import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.database import get_db
from app.models.user import UserCreate, UserLogin, TokenResponse
from bson import ObjectId
import re

router = APIRouter()


def _slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


@router.post("/register", response_model=TokenResponse)
async def register(body: UserCreate):
    db = get_db()
    if await db.users.find_one({"email": body.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    org_name = body.org_name or f"{body.name}'s Organisation"
    org_id = str(ObjectId())
    await db.organizations.insert_one({
        "_id": org_id,
        "name": org_name,
        "slug": _slugify(org_name),
        "subscription_tier": "free",
        "subscription_status": "inactive",
        "leads_limit": 50,
    })

    user_id = str(ObjectId())
    await db.users.insert_one({
        "_id": user_id,
        "org_id": org_id,
        "email": body.email,
        "name": body.name,
        "hashed_password": hash_password(body.password),
        "role": "admin",
        "is_active": True,
    })

    token_data = {"sub": user_id, "org_id": org_id}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user={"id": user_id, "email": body.email, "name": body.name, "role": "admin", "org_id": org_id},
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token_data = {"sub": str(user["_id"]), "org_id": user["org_id"]}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user={
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "org_id": user["org_id"],
        },
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: dict):
    payload = decode_token(body.get("refresh_token", ""))
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    db = get_db()
    user = await db.users.find_one({"_id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    token_data = {"sub": str(user["_id"]), "org_id": user["org_id"]}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user={"id": str(user["_id"]), "email": user["email"], "name": user["name"],
              "role": user["role"], "org_id": user["org_id"]},
    )

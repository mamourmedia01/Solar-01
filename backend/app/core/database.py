from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

_client: AsyncIOMotorClient | None = None


def _get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.MONGODB_URL)
    return _client


async def connect_db():
    _get_client()


async def close_db():
    global _client
    if _client is not None:
        _client.close()
        _client = None


def get_db():
    return _get_client()[settings.DB_NAME]

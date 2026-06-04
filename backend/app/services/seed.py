"""Startup seed helpers."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Node


SEED_NODES = [
    {"name": "EU-London", "latitude": 51.5074, "longitude": -0.1278, "status": "healthy"},
    {"name": "EU-Kyiv", "latitude": 50.4501, "longitude": 30.5234, "status": "healthy"},
    {"name": "US-East", "latitude": 40.7128, "longitude": -74.0060, "status": "healthy"},
    {"name": "AP-Tokyo", "latitude": 35.6762, "longitude": 139.6503, "status": "healthy"},
    {"name": "US-West", "latitude": 37.7749, "longitude": -122.4194, "status": "healthy"},
    {"name": "AP-Singapore", "latitude": 1.3521, "longitude": 103.8198, "status": "healthy"},
]


async def seed_nodes(session: AsyncSession) -> int:
    """Insert only missing seed nodes and return count of created records."""
    result = await session.execute(select(Node.name))
    existing_names = set(result.scalars().all())

    missing_nodes = [Node(**node) for node in SEED_NODES if node["name"] not in existing_names]
    if not missing_nodes:
        return 0

    session.add_all(missing_nodes)
    await session.commit()
    return len(missing_nodes)
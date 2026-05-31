"""Startup seed helpers."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Node


SEED_NODES = [
    Node(name="EU-London", latitude=51.5074, longitude=-0.1278, status="healthy"),
    Node(name="EU-Kyiv", latitude=50.4501, longitude=30.5234, status="healthy"),
    Node(name="US-East", latitude=40.7128, longitude=-74.0060, status="healthy"),
    Node(name="AP-Tokyo", latitude=35.6762, longitude=139.6503, status="healthy"),
    Node(name="US-West", latitude=37.7749, longitude=-122.4194, status="healthy"),
    Node(name="AP-Singapore", latitude=1.3521, longitude=103.8198, status="healthy"),
]


async def seed_nodes(session: AsyncSession) -> bool:
    """Insert seed nodes if the nodes table is empty."""
    result = await session.execute(select(Node))
    if result.scalars().first() is not None:
        return False

    session.add_all(SEED_NODES)
    await session.commit()
    return True
"""FastAPI application entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import router
from app.core.config import settings
from app.core.database import AsyncSessionLocal, Base, engine
from app import models as _models  # noqa: F401
from app.services.seed import seed_nodes


@asynccontextmanager
async def lifespan(app: FastAPI):
	async with engine.begin() as conn:
		await conn.run_sync(Base.metadata.create_all)
		print("Database tables created or verified.")

	async with AsyncSessionLocal() as session:
		if await seed_nodes(session):
			print("Seeded global nodes.")
		else:
			print("Nodes already seeded; skipping.")

	yield

	await engine.dispose()
	print("Database engine disposed.")


app = FastAPI(
	title="Global Telemetry & Chaos Engineering API",
	version="1.0.0",
	description="AIOps dashboard backend - manage nodes and simulate chaos incidents.",
	lifespan=lifespan,
)

app.add_middleware(
	CORSMiddleware,
	allow_origins=settings.cors_origins,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(router)
"""Application API router."""

from fastapi import APIRouter

from app.api.routes.auth import auth_router
from app.api.routes.health import health_router
from app.api.routes.telemetry import telemetry_router


router = APIRouter()
router.include_router(telemetry_router)
router.include_router(auth_router)
router.include_router(health_router)
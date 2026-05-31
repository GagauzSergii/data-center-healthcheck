"""Telemetry and chaos endpoints."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import Node, TelemetryLog
from app.schemas import GlobalLogRead, IncidentPayload, NodeRead, ResolvePayload, TelemetryLogRead
from app.services.chaos import VALID_INCIDENT_TYPES, build_incident_message


telemetry_router = APIRouter(prefix="/api")


@telemetry_router.get("/nodes", response_model=list[NodeRead], summary="List all global nodes")
async def list_nodes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Node).order_by(Node.id))
    return result.scalars().all()


@telemetry_router.post(
    "/chaos/incident",
    response_model=TelemetryLogRead,
    status_code=status.HTTP_201_CREATED,
    summary="Trigger a chaos incident",
)
async def trigger_incident(payload: IncidentPayload, db: AsyncSession = Depends(get_db)):
    node = await db.get(Node, payload.node_id)
    if not node:
        raise HTTPException(status_code=404, detail=f"Node {payload.node_id} not found.")

    incident_type = payload.incident_type.upper()
    if incident_type not in VALID_INCIDENT_TYPES:
        raise HTTPException(status_code=422, detail=f"incident_type must be one of {VALID_INCIDENT_TYPES}.")

    node.status = "critical"
    log = TelemetryLog(
        node_id=node.id,
        timestamp=datetime.now(tz=timezone.utc),
        error_type=incident_type,
        message=build_incident_message(incident_type),
    )
    db.add(log)
    await db.flush()
    await db.refresh(log)
    return log


@telemetry_router.post("/chaos/resolve", response_model=NodeRead, summary="Resolve a chaos incident")
async def resolve_incident(payload: ResolvePayload, db: AsyncSession = Depends(get_db)):
    node = await db.get(Node, payload.node_id)
    if not node:
        raise HTTPException(status_code=404, detail=f"Node {payload.node_id} not found.")

    node.status = "healthy"
    log = TelemetryLog(
        node_id=node.id,
        timestamp=datetime.now(tz=timezone.utc),
        error_type="RESOLVED",
        message=f"Incident resolved manually. Node {node.name} is now healthy.",
    )
    db.add(log)
    await db.flush()
    await db.refresh(node)
    return node


@telemetry_router.get(
    "/logs/{node_id}",
    response_model=list[TelemetryLogRead],
    summary="Recent telemetry logs for a node",
)
async def get_logs(node_id: int, limit: int = 20, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TelemetryLog)
        .where(TelemetryLog.node_id == node_id)
        .order_by(TelemetryLog.timestamp.desc())
        .limit(limit)
    )
    return result.scalars().all()


@telemetry_router.get(
    "/logs",
    response_model=list[GlobalLogRead],
    summary="Recent global telemetry logs",
)
async def get_global_logs(limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TelemetryLog, Node.name.label("node_name"))
        .join(Node, TelemetryLog.node_id == Node.id)
        .order_by(TelemetryLog.timestamp.desc())
        .limit(limit)
    )

    rows = result.all()
    logs = []
    for log, node_name in rows:
        log_dict = log.__dict__.copy()
        log_dict["node_name"] = node_name
        logs.append(log_dict)

    return logs
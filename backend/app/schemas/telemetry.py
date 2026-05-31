"""Telemetry request and response schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TelemetryLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    node_id: int
    timestamp: datetime
    error_type: str
    message: str


class GlobalLogRead(TelemetryLogRead):
    node_name: str


class IncidentPayload(BaseModel):
    node_id: int
    incident_type: str
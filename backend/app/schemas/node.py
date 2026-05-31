"""Node-related request and response schemas."""

from pydantic import BaseModel, ConfigDict


class NodeBase(BaseModel):
    name: str
    latitude: float
    longitude: float
    status: str


class NodeRead(NodeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class ResolvePayload(BaseModel):
    node_id: int
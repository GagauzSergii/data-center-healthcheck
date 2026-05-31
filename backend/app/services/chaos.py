"""Business logic for chaos incidents."""

import random


VALID_INCIDENT_TYPES = (
    "OOM",
    "NETWORK_DROP",
    "CPU_SPIKE",
    "STORAGE_FAILURE",
    "DB_LOCKS",
    "NET_TIMEOUT",
)

_OOM_MESSAGES = [
    "OutOfMemoryError: Java heap space exhausted - JVM killed.",
    "OOM Killer invoked: process 'node-exporter' terminated (RSS 14.2 GB).",
    "Memory limit exceeded: container killed by cgroups OOM killer.",
    "FATAL: pg_wal directory out of disk space - shared_buffers overflow.",
]

_NETWORK_DROP_MESSAGES = [
    "Connection timed out after 30 s: upstream peer unreachable.",
    "TCP retransmission storm detected - packet loss 87 %.",
    "BGP session dropped with peer AS64512 - link flap event.",
    "gRPC stream broken: DEADLINE_EXCEEDED after 10 s - circuit breaker OPEN.",
]

_OTHER_MESSAGES = {
    "CPU_SPIKE": ["CPU utilization at 100% for > 60s.", "Thermal throttling activated: Core temp 95C."],
    "STORAGE_FAILURE": ["I/O Error: Disk /dev/sda1 read-only.", "NVMe wear level critical: drive failing."],
    "DB_LOCKS": ["Deadlock detected: transaction 49202 aborted.", "Query blocked for 30s: heavy lock contention."],
    "NET_TIMEOUT": ["Connection timeout: API gateway unresponsive.", "DNS resolution failed for upstream service."],
}


def build_incident_message(incident_type: str) -> str:
    incident_type = incident_type.upper()
    if incident_type == "OOM":
        return random.choice(_OOM_MESSAGES)
    if incident_type == "NETWORK_DROP":
        return random.choice(_NETWORK_DROP_MESSAGES)
    if incident_type in _OTHER_MESSAGES:
        return random.choice(_OTHER_MESSAGES[incident_type])
    return f"Unknown critical incident of type {incident_type}."
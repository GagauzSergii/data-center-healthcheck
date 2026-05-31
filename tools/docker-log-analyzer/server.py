from collections import Counter
import re
import subprocess

from fastmcp import FastMCP


mcp = FastMCP("DockerLogAnalyzer")

ERROR_PATTERNS: dict[str, str] = {
    "timeout": r"timeout|timed out",
    "connection_refused": r"connection refused|could not connect|failed to connect",
    "dns_or_name_resolution": r"name or service not known|temporary failure in name resolution|gaierror",
    "database_error": r"sqlalchemy|asyncpg|postgres|database error",
    "authentication_error": r"unauthorized|forbidden|invalid token|authentication failed|permission denied",
    "out_of_memory": r"out of memory|oom|killed process",
    "internal_server_error": r"\b500\b|internal server error",
    "traceback": r"traceback \(most recent call last\)",
}


def _fetch_container_logs(container_name: str, lines: int) -> str:
    result = subprocess.run(
        ["docker", "logs", "--tail", str(lines), container_name],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout + result.stderr


@mcp.tool()
def get_container_logs(container_name: str = "backend", lines: int = 50) -> str:
    """Read the last N lines of logs from a specific Docker container."""
    try:
        logs = _fetch_container_logs(container_name, lines)
        return logs if logs else f"Container '{container_name}' has no logs."
    except subprocess.CalledProcessError as e:
        return f"Failed to read logs from container '{container_name}': {e.stderr}"
    except FileNotFoundError:
        return "Docker CLI was not found on this host."


@mcp.tool()
def summarize_incident(container_name: str = "backend", lines: int = 300) -> str:
    """Summarize recurring log issues and suggest likely next actions."""
    try:
        logs = _fetch_container_logs(container_name, lines)
        if not logs.strip():
            return f"No logs found for container '{container_name}'."

        lowered_logs = logs.lower()
        matches = Counter()
        for category, pattern in ERROR_PATTERNS.items():
            count = len(re.findall(pattern, lowered_logs, flags=re.IGNORECASE))
            if count > 0:
                matches[category] = count

        if not matches:
            return (
                "Incident Summary\n"
                f"Container: {container_name}\n"
                f"Log window: last {lines} lines\n"
                "Severity: Low\n"
                "No known error patterns were detected.\n"
                "Suggested actions:\n"
                "- Check warning-level messages for early signals.\n"
                "- Increase the log window for deeper analysis."
            )

        total_hits = sum(matches.values())
        if total_hits >= 25:
            severity = "High"
        elif total_hits >= 10:
            severity = "Medium"
        else:
            severity = "Low"

        top_issues = matches.most_common(3)
        probable_root_causes = {
            "timeout": "Service dependency latency or overloaded upstream.",
            "connection_refused": "Target service is down or not listening on expected port.",
            "dns_or_name_resolution": "Container network or DNS resolution issue.",
            "database_error": "Database availability, credentials, or query/runtime mismatch.",
            "authentication_error": "Invalid credentials/token or missing permissions.",
            "out_of_memory": "Insufficient memory allocation or memory leak.",
            "internal_server_error": "Unhandled exception in application code path.",
            "traceback": "Runtime exception detected in application flow.",
        }
        recommended_actions = {
            "timeout": "Verify response times and add retries/backoff for upstream calls.",
            "connection_refused": "Confirm target container health and port mapping.",
            "dns_or_name_resolution": "Check docker compose network aliases and DNS settings.",
            "database_error": "Validate DATABASE_URL and DB readiness/health checks.",
            "authentication_error": "Rotate and verify credentials/tokens used by the service.",
            "out_of_memory": "Increase memory limits and inspect high-memory code paths.",
            "internal_server_error": "Review stack traces around failing endpoint handlers.",
            "traceback": "Inspect first traceback occurrence and reproduce locally.",
        }

        lines_out = [
            "Incident Summary",
            f"Container: {container_name}",
            f"Log window: last {lines} lines",
            f"Severity: {severity}",
            "",
            "Top Issues:",
        ]

        for issue, count in top_issues:
            lines_out.append(f"- {issue}: {count} occurrences")

        primary_issue = top_issues[0][0]
        lines_out.extend(
            [
                "",
                "Probable Root Cause:",
                f"- {probable_root_causes[primary_issue]}",
                "",
                "Suggested Actions:",
                f"- {recommended_actions[primary_issue]}",
                "- Review recent deploys/config changes affecting this container.",
                "- Re-run summary after mitigation to confirm improvement.",
            ]
        )
        return "\n".join(lines_out)

    except subprocess.CalledProcessError as e:
        return f"Failed to analyze logs from container '{container_name}': {e.stderr}"
    except FileNotFoundError:
        return "Docker CLI was not found on this host."


@mcp.prompt()
def triage_incident(container_name: str = "backend") -> str:
    """Standardized prompt for AIOps incident response."""
    return (
        "You are the on-call Senior DevOps engineer. An alert has fired on a node. "
        f"Your task is to investigate the incident in container '{container_name}'.\n\n"
        "Follow this strict algorithm:\n"
        f"1. Call the tool 'get_container_logs' for '{container_name}'.\n"
        "2. Identify the stack trace or crash cause (for example OOM or timeout).\n"
        "3. Call the Jira tool to create a high-priority bug ticket.\n"
        "4. Call the Slack tool to send an incident report with the Jira link to the on-call channel."
    )


if __name__ == "__main__":
    mcp.run()
# GitHub Copilot Instructions — Data Center Healthcheck

## Available MCP Servers

### 1. postgres
Connects directly to the telemetry database.
- Connection: `postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@localhost:5432/<POSTGRES_DB>`
- Tables: `nodes`, `telemetry_logs`
- Use for: querying node status, incident history, health metrics
- Always use parameterized queries
- For multi-step operations use transactions

Example tasks:
- "Show all nodes with critical status"
- "Query telemetry_logs for OOM incidents in the last hour"
- "Which nodes have the most incidents today?"

### 2. atlassian
Connects to Jira via Atlassian Remote MCP.
- Endpoint: `https://mcp.atlassian.com/v1/mcp`
- Use for: reading tickets, updating status, adding comments, creating issues
- Note: ignore `-32601` errors in VS Code — tool calls execute successfully

Jira execution pattern (required):
1. Always call `getAccessibleAtlassianResources` first and take `id` as `cloudId`.
2. For status changes, call `getTransitionsForJiraIssue` before `transitionJiraIssue`.
3. Then call `getJiraIssue` to verify the final status.
4. Treat localized status names as valid equivalents (for example `In Progress` == `В роботі`).
5. If user references only a ticket number, assume project key `SCRUM` (for example `5` -> `SCRUM-5`).

Example tasks:
- "Show all In Progress tasks in the current sprint"
- "Move SCRUM-5 to In Review and add a comment"
- "Create a high-priority bug from this incident log"

### 3. docker-log-analyzer
Local FastMCP server at `tools/docker-log-analyzer/server.py`.
- Tools: `get_container_logs(container_name, lines)`, `summarize_incident(container_name, lines)`
- Prompt: `triage_incident(container_name)` — full workflow: logs → Jira → Slack
- Use for: reading Docker container logs, classifying errors, incident triage

Example tasks:
- "Get last 50 lines from the backend container"
- "Summarize incidents for the frontend container"
- "Run triage_incident on backend"

## Workflow Examples

**Incident response (full flow):**
1. Call `docker-log-analyzer` → `summarize_incident("backend")`
2. Call `postgres` → query `telemetry_logs` for affected node
3. Call `atlassian` → create Jira bug with incident details
4. Call `atlassian` → update status to In Progress

**Daily standup check:**
1. Call `atlassian` → list current sprint tasks by status
2. Call `postgres` → check node health summary

## Rules
- Always prefer MCP tools over manual SQL or API calls
- Do not hardcode credentials — use existing MCP server configuration
- For Postgres: use parameterized queries, close connections after use
- For Atlassian: always resolve `cloudId` via `getAccessibleAtlassianResources` before Jira issue operations
- For Atlassian: `missing cloudId` means a skipped resolution step, not an invalid token
- For Atlassian: check current sprint context before creating new tickets
- For docker-log-analyzer: default container is `backend`, default lines is `50`
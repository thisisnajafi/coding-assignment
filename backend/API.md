# Backend API contract

Base URL: `http://localhost:8000` (CORS allows `http://localhost:3000`). All bodies are JSON (UTF-8).

## Authentication (demo only)

Every `/api/*` request except `GET /api/users` and `GET /api/health` must send:

```
X-User: <username>        # maryam | hossein | it_admin
```

Missing/unknown user -> `401`. Roles are enforced on the server, never only in the UI.

## Enums

| Field | Values |
|---|---|
| role | `employee`, `it` |
| category | `hardware`, `network`, `software`, `access` |
| priority | `low`, `medium`, `high` |
| status | `open`, `in_progress`, `closed` |
| suggestion_source | `ai`, `fallback` |

## Shapes

`User`: `{ "id": 1, "username": "maryam", "role": "employee" }`

`TicketEmployee` (what an employee receives):
```json
{
  "id": 1, "title": "...", "body": "... (secrets masked as [REDACTED])",
  "status": "open", "category": "hardware", "priority": "medium",
  "final_reply": null, "replied_at": null,
  "created_at": "2026-10-27T13:30:00Z", "updated_at": "2026-10-27T13:30:00Z",
  "owner": "maryam"
}
```

`TicketIT` (what IT receives) = `TicketEmployee` plus:
```json
{
  "suggested_reply": "...",
  "suggestion_source": "ai",          // "fallback" = rule-based, not AI
  "suggestion_model": "gpt-4o",       // null for fallback
  "suggestion_note": null,            // e.g. reason AI was not used
  "replied_by": null
}
```

Errors: `{ "detail": "message" }` (validation errors use FastAPI's 422 list format).

## Endpoints

| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/api/health` | anyone | `{ "status": "ok", "ai_enabled": true }` |
| GET | `/api/users` | anyone | `User[]` for the demo user switcher |
| GET | `/api/me` | any user | `User` |
| GET | `/api/tickets` | any user | employee: own tickets only; IT: all. Newest first. Optional query for IT: `status`, `category`, `priority` |
| POST | `/api/tickets` | employee | body `{ "title": str(3..200), "body": str(5..5000) }` -> `201 TicketEmployee`. IT gets `403`. AI failure never fails creation |
| GET | `/api/tickets/{id}` | owner or IT | employee requesting someone else's ticket -> `404` |
| PATCH | `/api/tickets/{id}/status` | IT | body `{ "status": "in_progress" }` -> `TicketIT`; employees `403` |
| POST | `/api/tickets/{id}/reply` | IT | body `{ "reply": str(2..5000) }` -> `TicketIT`. Only one final reply per ticket: second -> `409` |
| POST | `/api/tickets/{id}/regenerate` | IT | body `{ "model": "gpt-4o" }` (optional) -> `TicketIT` with new suggestion; may fall back. Unknown model -> `422` |
| GET | `/api/ai/models` | IT | `{ "default": "gpt-4o", "models": ["gpt-4o", ...], "ai_enabled": true }` |

Employee responses never contain AI fields. IT responses are `TicketIT` everywhere.

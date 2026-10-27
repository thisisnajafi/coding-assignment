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

`Message`:
```json
{
  "id": 3, "ticket_id": 1, "author": "it_admin", "role": "it",
  "body": "... (secrets masked)", "reply_to_id": 2,
  "reply_to": { "id": 2, "author": "maryam", "role": "employee", "snippet": "first 140 chars…" },
  "is_final": false, "created_at": "2026-10-27T14:30:00Z"
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
| GET | `/api/tickets/{id}/messages` | owner or IT | `Message[]`, chronological. Others' tickets -> `404` |
| POST | `/api/tickets/{id}/messages` | owner or IT | body `{ "body": str(1..3000), "reply_to_id": int? }` -> `201 Message`. `reply_to_id` must be a message of the same ticket, else `422` |
| GET | `/api/ai/models` | IT | `{ "default": "gpt-4o", "models": ["gpt-4o", ...], "groups": [{ "provider": "openai", "label": "OpenAI", "models": ["gpt-4o", ...] }, ...], "ai_enabled": true }` |

Employee responses never contain AI fields. IT responses are `TicketIT` everywhere.

## Conversation thread (added later, backward compatible)

- Owner and IT can post any number of messages; `reply_to_id` quotes an earlier message of the same ticket.
- `POST /reply` still works exactly as before (one final reply, `409` on a second). It also appends a
  message with `is_final: true` to the thread.
- `POST /regenerate` sends the ticket plus the thread (chronological, role-labelled, oldest trimmed to
  a ~6000 character budget, secrets masked) to the AI; the suggestion is the next IT reply.
  Messages never include AI output, so employees never see it.

## Model allowlist

`/regenerate` accepts only allowlisted model ids (others -> `422`). Verified against GapGPT on 2026-10-27:

| Provider | Models |
|---|---|
| OpenAI | gpt-4o (default), gpt-4.1, gpt-4.1-mini, gpt-5-mini |
| Google Gemini | gemini-2.5-flash, gemini-2.5-pro, gemini-3-flash-preview |
| Anthropic Claude | claude-sonnet-4-5, claude-sonnet-4-6, claude-haiku-4-5-20251001 |
| DeepSeek | deepseek-chat, deepseek-v4-flash, deepseek-v4-pro |

`/ai/models` returns the allowlist intersected with GapGPT's live `/models` list, or the whole
allowlist when the live list is unavailable. `models` (flat) is kept for backward compatibility.

# Project documentation

`README.md` is the original assignment and is intentionally left unchanged; this file holds the
run instructions, decisions, assumptions and limitations that the assignment asks for.

## Run (one command)

```bash
cp backend/.env.example backend/.env   # optional: add GAPGPT_API_KEY to enable real AI
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000 (OpenAPI docs at http://localhost:8000/docs, contract in `backend/API.md`)

Without `backend/.env` (or without a key) everything still works: tickets are classified by the
rule-based fallback and the suggested reply is a template marked as non-AI.

The SQLite DB lives in the `backend-data` Docker volume. To reset demo data: `docker compose down -v`.
**Warning:** `-v` deletes the volume, i.e. wipes the whole database (all tickets and messages).
Use plain `docker compose down` to stop without losing data.

### Run without Docker

```bash
# backend (Python 3.12+)
cd backend && python -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
.venv/bin/uvicorn app.main:app --port 8000      # Windows: .venv\Scripts\...
# frontend (Node 20+)
cd frontend && npm install && npm run dev
```

### Tests (offline, no API key)

```bash
cd backend && pytest -q          # 43 tests, AI is mocked
cd frontend && npm test          # vitest (22 tests)
```

## Screenshots

| | |
|---|---|
| Employee (desktop) | `docs/screenshots/01-employee.png` |
| IT detail: header + status, body, thread with final reply, suggestion panel above composer | `docs/screenshots/02-it-dashboard.png` |
| Employee on mobile (390 px) | `docs/screenshots/03-mobile-employee.png` |
| IT ticket detail on mobile | `docs/screenshots/04-mobile-it.png` |
| Ticket conversation with reply-to quote | `docs/screenshots/05-thread.png` |
| Skeleton loaders while data loads | `docs/screenshots/06-skeleton-loading.png` |
| Provider-grouped model combobox | `docs/screenshots/07-model-picker.png` |

Taken with Playwright (headless Chromium) against `docker compose up --build` with a fresh database,
after an end-to-end run: the employee posts a message containing a password (stored masked), IT
replies to that message, regenerates the suggestion from the thread, and the employee sees the
quoted reply. The XSS sample shows as plain text (no dialog fired).

## Architecture

- `backend/` FastAPI + SQLAlchemy + SQLite. `app/routers/tickets.py` (endpoints and access control),
  `app/services.py` (ticket pipeline), `app/ai.py` (GapGPT client, prompt, validation, fallback),
  `app/security.py` (secret masking), `app/seed.py` (README users and tickets).
- `frontend/` Next.js App Router + TypeScript + shadcn/ui + Motion. Persian, RTL, Vazirmatn font,
  responsive. The demo user switcher sends the `X-User` header.

Ticket creation pipeline: validate input -> mask secrets -> AI triage (or fallback) -> strict enum
validation -> store. The AI step can never make creation fail.

## Main decisions

The exact AI prompt, the user-message template and a filled example are in [`PROMPTS.md`](PROMPTS.md).


- **AI provider:** GapGPT (OpenAI-compatible, `https://api.gapgpt.app/v1`), default `gpt-4o`, JSON mode,
  20 s timeout. When regenerating, IT can pick a model in a searchable combobox grouped by provider
  (OpenAI, Google Gemini, Anthropic Claude, DeepSeek; 3-4 models each). Every model on the allowlist
  was checked with a real triage call on 2026-10-27. The backend accepts only allowlisted ids (422 otherwise) and
  shows the allowlist intersected with GapGPT's live `/models` (full allowlist if that call fails).
- **Strict output validation:** `AITriage` pydantic model, `extra="forbid"`, enums for category
  (`hardware/network/software/access`) and priority (`low/medium/high`), case-sensitive. Any invalid
  JSON, unknown value (e.g. `CRITICAL`), missing or extra field rejects the whole AI answer.
- **Fallback:** keyword scoring (Persian + English, Arabic ي/ك normalised) for the category,
  priority always `medium` (a rule engine should not guess urgency; a human re-prioritises), and a
  Persian template reply. Shown in the IT UI as "non-AI" with the reason (timeout, invalid output...).
- **Prompt injection:** the system prompt states the ticket is untrusted data inside `<ticket>` tags
  and must not be obeyed; the user cannot close the tag (it is neutralised); only the single ticket
  is sent (no other users' data exists in the prompt); the model has no tools and its output only
  fills suggestion fields + category/priority. Status, replies and other tickets are changed only by
  explicit IT actions. The README injection ticket ends up as `software / medium`.
- **Secrets:** passwords and tokens are masked (`[REDACTED]`) before storing and before the AI call
  (keyed patterns like `password: x`/`رمز: x`, API-key formats, and password-like tokens such as
  `Maryam@1402`). The raw text is never persisted.
- **XSS:** ticket text is stored verbatim and rendered only as React text (no
  `dangerouslySetInnerHTML`), so the `<img onerror>` sample is shown as text.
- **Access control (server-side):** employees can create tickets and read only their own (other
  tickets return 404, not 403, to avoid ID enumeration); employee responses never include AI fields.
  Only IT can list all tickets, change status, regenerate suggestions, list models and post the final
  reply (exactly one per ticket; a second returns 409). IT users cannot create tickets.
- **Conversation thread (extension by user request):** the spec asks for one final reply per
  ticket; that still works unchanged (`POST /reply`, 409 on a second one). On top of it the owner
  and IT can exchange any number of messages, optionally replying to a specific message (quoted).
  Messages use the same access rules (others' tickets 404) and the same secret masking. The final
  reply is shown once, inside the thread, flagged "final reply" (the IT header only shows a short
  note that it was sent).
- **Using the AI suggestion (IT only):** the suggestion panel sits right above the composer. IT can
  "use in reply" (copies it into the composer to edit), "send in thread" (posts it unchanged after
  a confirmation) or, while no final reply exists, "send as final reply" (also after confirmation).
  A sent suggestion is marked "used". Nothing is ever sent automatically.
- **Thread-aware suggestions:** regenerate sends the ticket plus its own thread (chronological,
  role-labelled `<message role="employee|it">`, oldest messages trimmed to ~6000 chars, delimiters
  neutralised, secrets already masked). The prompt treats every message as untrusted data and asks for
  the next IT reply. No other ticket's data is ever included. Employees never receive AI output.
- **UI:** skeleton loaders shaped like the real cards, list, detail, thread, model picker and user switcher;
  `prefers-reduced-motion` respected (CSS + Motion `reducedMotion="user"`); long bodies collapse
  with "show more"; pasted English/log lines render in an LTR monospace block; toasts for all
  actions; inline form validation; optional dark mode.
- **Seeding:** the 3 users and 6 README tickets are created on first start through the same pipeline.

## Assumptions

- Demo login = choosing a user; `X-User` header identifies the caller.
- After the final reply is sent it cannot be edited (one reply per ticket as the spec says).
  Status is independent: IT decides when to close.
- Regenerating a suggestion may update category/priority (they are AI/rule suggestions too).
- AI replies are in Persian; the UI is Persian, code and docs are in English.

## Limitations

- No real authentication: anyone can send any `X-User` header.
- No migrations (tables are created at startup), no pagination.
- Rate limiting is in-memory (per process), so it resets on restart and is not shared across replicas.
- Secret masking is heuristic: it can miss unusual secrets or mask some harmless tokens.
- Seeding with a key makes 6 AI calls at first start (a few seconds).
- No audit log, comments thread or notifications.

## Security limitations

- **Demo auth is not authentication.** The caller is identified only by the `X-User` header, so
  anyone who can reach the API can impersonate any user (including IT) by sending another
  username. It exists only to make the demo easy to try. The backend logs a warning at startup
  when `DEMO_MODE` is on.
- `GET /api/users` is the **demo user picker** (it lists seeded accounts for the login screen).
  It is available only when `DEMO_MODE=true` and returns 404 otherwise.
- `/docs` and `/openapi.json` are served only when `DEMO_MODE` or `DEBUG` is on.
- AI calls are rate limited per user and per IP (`AI_RATE_PER_MINUTE`, default 5/min) plus a daily
  cap (`AI_DAILY_CAP`). When a limit is hit, ticket creation still succeeds with the rule-based
  fallback answer; manual "regenerate suggestion" returns HTTP 429 with a clear message (shown as a
  toast in the UI).
- Security headers are set by the backend middleware and by `next.config.ts` (CSP,
  `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`). The frontend
  CSP allows `'unsafe-inline'` scripts/styles because Next.js injects inline bootstrap code; a
  nonce-based CSP would be stricter.
- Docker Compose binds ports to `127.0.0.1` only, so the demo is not reachable from the network.
- Secret masking (passwords, `sk-`/`sk-proj-` keys, GitHub tokens, AWS keys, JWTs, Bearer tokens,
  Slack/Google keys, private keys) is heuristic and can miss unusual secrets.
- `docker compose down -v` wipes the database volume.

## For real production use

- Replace `X-User` with real authentication (company SSO via OIDC/SAML, or sessions/JWT with
  password hashing) and derive the role from the identity provider, not from the client.
- HTTPS, secure cookies + CSRF protection (or bearer tokens), strict CORS, rate limiting,
  security headers/CSP.
- PostgreSQL with Alembic migrations, audit log of status/reply changes, backups.
- Secrets in a secret manager; AI calls via a queue with retries; monitoring of fallback rate.
- Data-processing agreement / on-prem model if ticket data must not leave the organisation.

## With more time

- Background AI processing so ticket creation returns instantly, with live updates.
- Comment thread between employee and IT, attachments, SLA timers, assignment to agents.
- Evaluation set for classification quality; better PII detection (names, phone numbers, national IDs).
- E2E tests (Playwright) in CI.

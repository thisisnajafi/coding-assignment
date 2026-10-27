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
cd backend && pytest -q          # 33 tests, AI is mocked
cd frontend && npm test          # vitest
```

## Architecture

- `backend/` FastAPI + SQLAlchemy + SQLite. `app/routers/tickets.py` (endpoints and access control),
  `app/services.py` (ticket pipeline), `app/ai.py` (GapGPT client, prompt, validation, fallback),
  `app/security.py` (secret masking), `app/seed.py` (README users and tickets).
- `frontend/` Next.js App Router + TypeScript + shadcn/ui + Motion. Persian, RTL, Vazirmatn font,
  responsive. The demo user switcher sends the `X-User` header.

Ticket creation pipeline: validate input -> mask secrets -> AI triage (or fallback) -> strict enum
validation -> store. The AI step can never make creation fail.

## Main decisions

- **AI provider:** GapGPT (OpenAI-compatible, `https://api.gapgpt.app/v1`), default `gpt-4o`, JSON mode,
  20 s timeout. IT can pick another model when regenerating a suggestion; the list comes from
  `/models` (filtered to chat models, snapshots hidden) with a static fallback list. Requested model
  names are checked against that list.
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
- **Seeding:** the 3 users and 6 README tickets are created on first start through the same pipeline.

## Assumptions

- Demo login = choosing a user; `X-User` header identifies the caller.
- After the final reply is sent it cannot be edited (one reply per ticket as the spec says).
  Status is independent: IT decides when to close.
- Regenerating a suggestion may update category/priority (they are AI/rule suggestions too).
- AI replies are in Persian; the UI is Persian, code and docs are in English.

## Limitations

- No real authentication: anyone can send any `X-User` header.
- No migrations (tables are created at startup), no pagination, no rate limiting.
- Secret masking is heuristic: it can miss unusual secrets or mask some harmless tokens.
- Seeding with a key makes 6 AI calls at first start (a few seconds).
- No audit log, comments thread or notifications.

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

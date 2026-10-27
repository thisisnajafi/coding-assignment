# AI usage

## Tools

- **An AI coding assistant (agent mode)** working in my repository and terminal: it scaffolded the
  FastAPI backend and Next.js frontend, wrote most of the code and tests, ran them, built the Docker
  images and took the screenshots with Playwright. I defined the architecture, security rules,
  fallback behaviour and commit plan, and reviewed the output.
- **GapGPT (OpenAI-compatible API, `gpt-4o`)** inside the product for ticket triage.

## Where it helped

- Fast scaffolding (FastAPI routers, SQLAlchemy models, shadcn/ui components, RTL layout, Dockerfiles).
- Writing the offline test suite with a fake AI client, including edge cases I listed
  (invalid enums, timeouts, injection, masking).
- Persian UI text and the system prompt draft.

## Limitations / what I had to correct or check

- Pydantic `strict=True` with string enums rejected valid AI answers; caught by tests and changed to
  exact (case-sensitive) enum matching with `extra="forbid"`.
- The first secret-masking heuristic also masked HTML in the XSS sample ticket; adjusted so markup is
  kept as plain text and only password-like tokens are masked.
- The raw GapGPT model list was very long (dated snapshots, non-chat models); added filtering.
- Reasoning models reject a custom `temperature`, so it is only sent to classic chat models.
- Security decisions (404 for others' tickets, AI never changing state, masking before the AI call)
  were specified by me and verified with tests rather than trusted from generated code.
- Generated code needed review for consistency between the backend API contract and the frontend.

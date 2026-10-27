# Frontend

Next.js (App Router, TypeScript) + Tailwind + shadcn/ui + Motion. Persian RTL UI with the Vazirmatn font bundled via `@fontsource` (no runtime CDN).

## Run

```bash
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev   # http://localhost:3000
npm test        # vitest + testing-library
npm run build
```

Docker (the API URL is baked in at build time because it is a `NEXT_PUBLIC_` variable):

```bash
docker build -t ticket-frontend --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 .
docker run -p 3000:3000 ticket-frontend
```

## Notes

- The header has a demo user switcher (`maryam`, `hossein` = employee, `it_admin` = IT). The choice is stored in `localStorage` and sent as the `X-User` header.
- All ticket text (title, body, AI suggestion, reply) is rendered as plain text via React; `dangerouslySetInnerHTML` is never used.

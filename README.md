# hackaton-starter

Opinionated Next 16 starter: **Elysia API + Better Auth + Drizzle/Postgres +
Eden/TanStack Query**, with a Result-pattern response envelope and one
`Project` CRUD domain to clone. No Firebase — Postgres only.

## Stack

Next 16 · React 19 · Elysia (`/api/v1`) · Better Auth (email+password) ·
Drizzle ORM + node-postgres · Eden + `eden-tanstack-react-query` · zod ·
shadcn/ui + Tailwind v4 · LogTape · Vitest · Biome.

## Quick start

Scaffold a new project with the CLI (see [`cli/create-shipkit`](./cli/create-shipkit)):

```bash
npx create-shipkit my-app
```

Or clone this repo directly and follow **Setup** below.

## Setup

```bash
pnpm install
cp .env.example .env      # fill DATABASE_URL, BETTER_AUTH_SECRET, NEXT_PUBLIC_APP_URL
pnpm db:migrate           # apply migrations to your Postgres
pnpm dev                  # http://localhost:3000
```

`BETTER_AUTH_SECRET`: `openssl rand -base64 32`. `DATABASE_URL`: any Postgres
(Supabase, Neon, local). Env is validated at boot by `src/config/env.ts`.

## Architecture

Domains live under `src/core/<domain>/`:

| Layer | Holds |
|-------|-------|
| `domain/` | zod `schemas.ts` + inferred `types.ts` (single type source) |
| `server/repository/` | Drizzle access (`import "server-only"` + shared `db`) |
| `server/services/` | orchestration, returns `AsyncAppResult<T>`, enforces ownership |
| `server/api/` | Elysia leaf `*.route.ts` + a domain `router.ts` (prefix) |
| `client/` | Eden/TanStack-Query hooks + shadcn UI |

Wire rules: every response is the `CommonResponse` envelope
(`{ response?, code, status }`); expected 4xx are `err(AppErrors.x)` values, not
throws; authed routes carry both `.use(authed)` and `authed: true`.

### Add a new domain

Clone `src/core/project/` → `src/core/<domain>/`, add a
`schemas/<domain>-schema.ts` Drizzle table (export from `schemas/index.ts`),
then wire the domain router into `src/server/router.ts` with `.use(<domain>Router)`.
**A router isn't live until it's `.use()`d in `server/router.ts`.**
Regenerate + apply migrations: `pnpm db:generate && pnpm db:migrate`.

## Astramia flow

`/lectura/amor` (quiz, anonymous Better Auth session) → `POST /readings`
writes a free teaser → `/lectura/r/:id` shows it with the rest blurred →
`POST /readings/:id/checkout` opens the hosted checkout → the gateway's webhook
(`/payments/webhooks/:provider`) or the return URL syncs the payment → the
paid order unlocks the reading, whose full text is written on first open, and
opens the 2-hour chat (`POST /readings/:id/chat`, streamed with the AI SDK).

### Switching payment gateway

Services only know the `PaymentGateway` interface
(`src/core/payment/server/repository/gateways/payment-gateway.ts`). To move off
Mercado Pago:

1. Add `gateways/<name>.ts` implementing the interface (checkout, webhook
   verification, return URL, fetch payment) and register it in `gateways/index.ts`.
2. Add `<name>` to `paymentProviderSchema` and to `PAYMENT_PROVIDER` in `src/config/env.ts`.
3. Set `PAYMENT_PROVIDER=<name>` plus its credentials, point the gateway's
   webhook at `/api/v1/payments/webhooks/<name>`, and set `ACTIVE_PROCESSOR`
   in `src/core/legal/domain/business.ts` so the legal copy names it.

Orders keep their `provider`, so the old gateway's refunds and late webhooks
still land. No migration, no service or UI change.

Check that the new gateway charges the catalog currency as-is
(`PRODUCTS` in `src/core/payment/domain/catalog.ts`): payments are only applied
when amount *and* currency match the order. Mercado Pago Perú accepts a USD
preference but converts it and reports the payment in PEN, so the catalog
prices in soles.

### Local end-to-end (real Mercado Pago test checkout)

```bash
npx -p @electric-sql/pglite -p @electric-sql/pglite-socket pglite-server --db=./.pglite --max-connections=20
# .env: DATABASE_URL="postgres://postgres:postgres@127.0.0.1:5432/postgres?sslmode=disable"
#       NEXT_PUBLIC_APP_URL="https://localhost:3000"
pnpm db:migrate
next dev --experimental-https    # add --experimental-https-ca <bundle> behind a TLS-inspecting proxy
```

- Mercado Pago only auto-returns to an **https** `back_urls.success`; over
  http the preference is created without `auto_return` and the buyer stays
  on Mercado Pago's receipt.
- Webhooks need a public https URL (`notification_url` is only sent on
  https); locally the return URL does the sync.
- Peru test card: Visa `4009 1753 3280 6176`, `11/30`, CVV `123`, DNI
  `123456789`; holder `APRO` approves, `OTHE` rejects (it may stay
  `in_process` for a while).
- Next replaces `NODE_EXTRA_CA_CERTS` when serving https, hence the `-ca` flag
  when outbound TLS needs a custom CA.

AI calls go through the Vercel AI Gateway (`AI_MODEL_*` are gateway ids), so
switching model or provider is an env change; every call is logged in
`ai_usage` with tokens and USD cost.

### Prompts

`src/core/reading/domain/prompts.ts` holds every prompt and `AI_TASKS` (token
budget and reasoning level per call; reasoning tokens count against the
budget). The model never computes astrology: `chart.ts` hands it the natal
placements, aspects, an honest "uncertain Moon" when there's no birth time,
and Venus's real dates for the next months, so it interprets instead of
inventing. Change a prompt, then measure it:

```bash
pnpm eval:prompts                                    # production models
pnpm eval:prompts --reading-model=google/gemini-3.8-flash --label=try
pnpm eval:prompts --rpm=5                            # free Gateway tier: 5 req/min
```

Models live in `src/core/ai/domain/models.ts` (overridable with `AI_MODEL_*`):
Gemini 4 Argon for the hook and the reading, Gemini 3.8 Flash for the chat and
as the Gateway fallback when a call's model fails; `ai_usage` records the
model that actually answered.

The eval runs teaser → reading → chat over six varied profiles, a Gemini judge
scores them with a rubric (specificity, hook, rigor, voice, form of address…)
next to mechanical checks (cuts, voseo, banned phrases, cost, latency), and
writes the texts to `.eval/` for reading them yourself. The judge is lenient
with high scores; its lists of inventions and clichés are the useful part.

## Scripts

`pnpm dev | build | start` · `pnpm test` · `pnpm check` (Biome) ·
`pnpm typecheck` · `pnpm db:generate | db:migrate | db:studio`.

## Known notes

- OpenAPI (Scalar) is dev-only at `/api/v1/openapi`.
- `eden-tanstack-react-query` is at `^0.1.10`; if a proxy typing breaks after an
  upgrade, pin it.
- Better Auth UI components were installed via `pnpm dlx shadcn@latest add https://better-auth-ui.com/r/auth.json`
  and are vendored (editable) under `src/frontend/components/auth/`.
- `db.ts` uses `ssl: { rejectUnauthorized: false }` for convenience with hosted Postgres
  (Supabase, Neon); review this for production deployments.

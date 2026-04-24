# Blocks

Track your academic blocks (2h each). Log activities per day, no time-of-day — just an ordered list per day with full or half-block sizing, plus weekly/monthly stats.

## Stack

- Nuxt 4 + Nuxt UI
- SQLite + Drizzle ORM (`better-sqlite3`)
- `nuxt-auth-utils` with direct Google OAuth
- PM2 for deployment

## Local development

```bash
cp .env.example .env
# Fill in NUXT_SESSION_PASSWORD and Google OAuth credentials
pnpm install
pnpm dev
```

Google OAuth redirect URI (Google Cloud Console): `http://localhost:3000/auth/google`.

DB migrations run automatically on server boot. To regenerate after schema changes:

```bash
pnpm db:generate
```

## Deployment (bare server with PM2)

On the server:

```bash
git pull
pnpm install --prod=false
pnpm build
pm2 startOrReload ecosystem.config.cjs
pm2 save
```

- The app listens on `HOST:PORT` from env (defaults `127.0.0.1:3000`). Front with nginx + TLS.
- SQLite file lives at `DATABASE_URL` (default `./data/blocks.db`). Back it up.
- Migrations run automatically on startup via a Nitro plugin.

Google OAuth redirect URI: `https://your-domain.example/auth/google`.

## Routes

- `/` — Week view (Mon–Fri) on desktop, day view on mobile
- `/stats` — Week/month bar chart + totals per activity
- `/activities` — Manage your activity list (add/rename/recolor/archive)
- `/login` — Google sign-in

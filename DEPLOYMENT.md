# Deployment Guide

## How Deployments Work

Both apps deploy automatically via GitHub Actions when you push to `main` or `develop`.

- `main` → production (`admin.u-do-craft.store` + `u-do-craft.store`)
- `develop` → Vercel preview URLs (staging)

The workflow files live in `.github/workflows/`:
- `ci.yml` — runs type-check + lint on every PR
- `deploy.yml` — deploys both apps on push to `main` or `develop`

---

## One-Time Setup: GitHub Secrets

Before the first deploy, add these secrets to your GitHub repo:

**GitHub → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create token |
| `VERCEL_ORG_ID` | `team_XX3rqg5IE2XdK6oxIVibJTt6` |

That's all the workflow needs — the Vercel project links are already configured in `apps/admin/.vercel/project.json` and `apps/client/.vercel/project.json`.

---

## Deploying to Production

```bash
git add .
git commit -m "your message"
git push origin main
```

GitHub Actions picks it up, builds both apps, and deploys. Check progress at:
`https://github.com/andriihukco/udo-craft/actions`

---

## Branch Workflow

```
feature/my-thing  →  develop  →  main
     (local)        (staging)  (production)
```

1. Create a branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   ```

2. Work, commit, push:
   ```bash
   git push origin feature/my-feature
   ```

3. Open a PR to `develop` on GitHub. CI runs type-check + lint automatically.

4. Merge to `develop` → deploys to staging (Vercel preview URL).

5. When ready for production, open a PR from `develop` → `main` and merge.

**Never push directly to `main`.**

---

## Environments

### Production
- Admin: `https://admin.u-do-craft.store`
- Client: `https://u-do-craft.store`
- Supabase: production project
- Env vars: set in Vercel dashboard for each project

### Staging / Dev
- Supabase: `udocraft-dev` project (separate credentials)
- Env vars: set in Vercel dashboard under Preview environment

---

## Environment Variables

Set these in the Vercel dashboard for each project (Settings → Environment Variables).

**Admin** (`prj_uNMByvkPtFNKthWbXcbTTdDOvIt2`):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL        = https://admin.u-do-craft.store
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
NEXT_PUBLIC_SENTRY_DSN     (optional)
```

**Client** (`prj_GTScm9WnDiwD837rrOKHsXiFRsFS`):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL        = https://u-do-craft.store
NEXT_PUBLIC_SENTRY_DSN     (optional)
```

For staging (Preview environment), use the `udocraft-dev` Supabase project credentials.

---

## Manual Deploy (CLI)

If you need to deploy without pushing to git:

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy admin
vercel deploy --prod --yes --cwd=apps/admin

# Deploy client
vercel deploy --prod --yes --cwd=apps/client
```

You'll be prompted to authenticate if not already logged in.

---

## Project IDs Reference

| App | Project ID | Domain |
|---|---|---|
| Admin | `prj_uNMByvkPtFNKthWbXcbTTdDOvIt2` | `admin.u-do-craft.store` |
| Client | `prj_GTScm9WnDiwD837rrOKHsXiFRsFS` | `u-do-craft.store` |
| Org | `team_XX3rqg5IE2XdK6oxIVibJTt6` | — |

---

## Troubleshooting

**Build fails: "Cannot find module '@udo-craft/shared'"**
The build must run from the repo root. The `vercel.json` in each app handles this — don't run `vercel deploy` from inside an app directory.

**Deployment succeeded but domain shows old code**
The domain alias may be stale. Go to Vercel dashboard → your project → Deployments, find the latest, and promote it to production.

**Type errors in CI**
Run `npm run type-check` locally first and fix before pushing.

**Telegram notifications not working after deploy**
Call `GET /api/telegram/setup` once after deploying admin to register the webhook.

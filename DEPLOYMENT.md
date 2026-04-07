# Deployment Guide

## Quick Start

### Recommended: Automatic Deployment (via Git)
```bash
# Deploy to production (both admin and client)
git push origin main

# Deploy to staging
git push origin develop
```

That's it. GitHub Actions handles everything automatically.

---

## Manual Deployment (CLI)

If you need to deploy without pushing to git:

```bash
# Set your Vercel token (get from https://vercel.com/account/tokens)
export VERCEL_TOKEN=your_token_here

# Deploy both apps
./scripts/deploy.sh

# Deploy only admin
./scripts/deploy.sh admin

# Deploy only client
./scripts/deploy.sh client
```

---

## ⚠️ CRITICAL: Update Domain Aliases After Deployment

**This is the most common mistake.** After deploying, you MUST update the domain aliases to point to the new deployments, otherwise the old cached version will be served.

```bash
# After deploying admin, get the new deployment URL from Vercel output
# Then update the alias:
vercel alias set <new-deployment-url> admin.u-do-craft.store --scope team_XX3rqg5IE2XdK6oxIVibJTt6

# After deploying client:
vercel alias set <new-deployment-url> www.u-do-craft.store --scope team_XX3rqg5IE2XdK6oxIVibJTt6
```

**Example:**
```bash
# If deployment output shows: udo-craft-admin-7uandexb1-ahuk1312-gmailcoms-projects.vercel.app
vercel alias set udo-craft-admin-7uandexb1-ahuk1312-gmailcoms-projects.vercel.app admin.u-do-craft.store --scope team_XX3rqg5IE2XdK6oxIVibJTt6

# If deployment output shows: udo-craft-client-15et09o4i-ahuk1312-gmailcoms-projects.vercel.app
vercel alias set udo-craft-client-15et09o4i-ahuk1312-gmailcoms-projects.vercel.app www.u-do-craft.store --scope team_XX3rqg5IE2XdK6oxIVibJTt6
```

**Why this matters:**
- New code is deployed to a unique URL (e.g., `udo-craft-admin-7uandexb1-...`)
- The domain alias (e.g., `admin.u-do-craft.store`) points to a deployment
- If you don't update the alias, it keeps pointing to the OLD deployment
- Users see the old code, not your new fixes
- This is why the direct Vercel URL worked but the domain didn't

---

## Why We Changed the Deployment Process

### The Old Way (❌ Confusing)
```bash
# Deploy admin
vercel deploy --prod --yes --local-config vercel.admin.json

# Deploy client — swap .vercel/project.json first
echo '{"projectId":"prj_GTScm9WnDiwD837rrOKHsXiFRsFS",...}' > .vercel/project.json
vercel deploy --prod --yes --local-config vercel.client.json

# Restore to admin
echo '{"projectId":"prj_uNMByvkPtFNKthWbXcbTTdDOvIt2",...}' > .vercel/project.json
```

**Problems:**
- Manual file manipulation error-prone
- Easy to forget to restore `.vercel/project.json`
- Confusing for new team members
- Risk of deploying wrong app to wrong project

### The New Way (✅ Clean)
```bash
# Option 1: Just push to git (recommended)
git push origin main

# Option 2: Use deployment script
./scripts/deploy.sh
```

**Benefits:**
- No manual file manipulation
- Project IDs embedded in script
- Clear, simple commands
- Automatic via GitHub Actions
- Impossible to deploy to wrong project

---

## How It Works

### GitHub Actions (Automatic)
When you push to `main` or `develop`, GitHub Actions:
1. Checks out code
2. Installs dependencies
3. Builds both apps
4. Deploys admin to `admin.u-do-craft.store`
5. Deploys client to `www.u-do-craft.store`
6. **Automatically updates domain aliases** ✅

See `.github/workflows/deploy.yml` for details.

### Deployment Script (Manual)
`scripts/deploy.sh` uses Vercel CLI with:
- Correct project IDs for each app
- Correct org ID
- Correct build commands
- No file manipulation needed

**⚠️ Note:** When using the script, you must manually update aliases (see section above).

### App-Level Vercel Config
Each app has its own `vercel.json`:
- `apps/admin/vercel.json` — builds admin
- `apps/client/vercel.json` — builds client

This allows Vercel to resolve workspace packages correctly.

---

## Troubleshooting

### "Domain shows old code after deployment"
**This is the alias issue.** The domain is pointing to an old deployment.

**Solution:**
1. Get the new deployment URL from Vercel output
2. Run: `vercel alias set <new-url> admin.u-do-craft.store --scope team_XX3rqg5IE2XdK6oxIVibJTt6`
3. Wait 30 seconds for DNS to propagate
4. Refresh the domain

### "Direct Vercel URL works but domain doesn't"
Same issue — the alias is stale. Update it (see above).

### "Deployment went to wrong project"
This shouldn't happen with the new process. If it does:
1. Check `.vercel/project.json` — it should only exist at root for reference
2. Use GitHub Actions (git push) instead of manual CLI
3. Use `./scripts/deploy.sh` if you must deploy manually

### "Build failed: Cannot find module '@udo-craft/shared'"
This means the build ran from the wrong directory. With the new setup:
- GitHub Actions builds from repo root ✅
- `./scripts/deploy.sh` builds from repo root ✅
- Manual `vercel deploy` from app directory ❌ (don't do this)

### "VERCEL_TOKEN not set"
```bash
export VERCEL_TOKEN=your_token_here
./scripts/deploy.sh
```

Get your token from https://vercel.com/account/tokens

---

## Environment Variables

Set these in Vercel dashboard for each project:

**Admin** (`admin.u-do-craft.store`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` = `https://admin.u-do-craft.store`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SENTRY_DSN` (optional)

**Client** (`www.u-do-craft.store`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` = `https://www.u-do-craft.store`
- `NEXT_PUBLIC_SENTRY_DSN` (optional)

---

## Project IDs Reference

| App | Project ID | Domain |
|---|---|---|
| Admin | `prj_uNMByvkPtFNKthWbXcbTTdDOvIt2` | `admin.u-do-craft.store` |
| Client | `prj_GTScm9WnDiwD837rrOKHsXiFRsFS` | `www.u-do-craft.store` |
| Org | `team_XX3rqg5IE2XdK6oxIVibJTt6` | — |

---

## Deployment Checklist

Use this before every production deployment:

- [ ] Code is committed and pushed to `main`
- [ ] GitHub Actions completed successfully
- [ ] Check Vercel deployment URLs in the workflow output
- [ ] Update admin alias: `vercel alias set <admin-url> admin.u-do-craft.store --scope team_XX3rqg5IE2XdK6oxIVibJTt6`
- [ ] Update client alias: `vercel alias set <client-url> www.u-do-craft.store --scope team_XX3rqg5IE2XdK6oxIVibJTt6`
- [ ] Wait 30 seconds for DNS propagation
- [ ] Test both domains work correctly
- [ ] Verify new code is live (not old cached version)


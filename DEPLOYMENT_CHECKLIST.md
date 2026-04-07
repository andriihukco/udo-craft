# Deployment Checklist

Use this before every production deployment to avoid common mistakes.

## Pre-Deployment

- [ ] All changes committed to `main` branch
- [ ] Code reviewed and tested locally
- [ ] No console errors or warnings

## During Deployment

### Option A: Git Push (Recommended)
```bash
git push origin main
```
- [ ] GitHub Actions workflow started
- [ ] Wait for workflow to complete (check Actions tab)
- [ ] Verify both apps built successfully

### Option B: Manual CLI
```bash
export VERCEL_TOKEN=your_token
./scripts/deploy.sh
```
- [ ] Both apps deployed successfully
- [ ] Note the deployment URLs from output

## Post-Deployment (CRITICAL!)

**⚠️ This step is easy to forget but REQUIRED**

### 1. Get New Deployment URLs
From GitHub Actions output or Vercel CLI output, find:
- New admin URL: `udo-craft-admin-XXXXX-...vercel.app`
- New client URL: `udo-craft-client-XXXXX-...vercel.app`

### 2. Update Domain Aliases

```bash
# Update admin alias
vercel alias set udo-craft-admin-XXXXX-ahuk1312-gmailcoms-projects.vercel.app admin.u-do-craft.store --scope team_XX3rqg5IE2XdK6oxIVibJTt6

# Update client alias
vercel alias set udo-craft-client-XXXXX-ahuk1312-gmailcoms-projects.vercel.app www.u-do-craft.store --scope team_XX3rqg5IE2XdK6oxIVibJTt6
```

- [ ] Admin alias updated
- [ ] Client alias updated
- [ ] Wait 30 seconds for DNS propagation

### 3. Verify Deployment

```bash
# Test admin
curl -I https://admin.u-do-craft.store

# Test client
curl -I https://www.u-do-craft.store
```

- [ ] Both domains return 200 OK
- [ ] Test login on admin (should work without Sentry errors)
- [ ] Test client homepage loads
- [ ] Verify new code is live (not old cached version)

## Troubleshooting

### "Domain shows old code"
→ You forgot to update the alias. Do it now:
```bash
vercel alias set <new-url> admin.u-do-craft.store --scope team_XX3rqg5IE2XdK6oxIVibJTt6
```

### "Direct Vercel URL works but domain doesn't"
→ Same issue. Update the alias.

### "Can't login to admin"
→ Check if Sentry error appears. If yes, the old deployment is being served. Update alias.

### "Build failed"
→ Check GitHub Actions logs or Vercel build output for errors.

## Quick Reference

| Item | Value |
|---|---|
| Admin Project ID | `prj_uNMByvkPtFNKthWbXcbTTdDOvIt2` |
| Client Project ID | `prj_GTScm9WnDiwD837rrOKHsXiFRsFS` |
| Org ID | `team_XX3rqg5IE2XdK6oxIVibJTt6` |
| Admin Domain | `admin.u-do-craft.store` |
| Client Domain | `www.u-do-craft.store` |

## Remember

> **The most common mistake:** Forgetting to update domain aliases after deployment.
> 
> New code deploys to a unique URL. The domain alias must point to it, or users see the old code.

# GitHub Deployment Setup Guide

Your code has been pushed to GitHub and is ready to deploy via GitHub Actions. Follow these steps to complete the setup:

## Step 1: Create a Vercel Token

1. Go to https://vercel.com/account/tokens
2. Click "Create" to create a new token
3. Name it: `github-actions-deployment`
4. Copy the token (you'll need it in the next step)

## Step 2: Add GitHub Secrets

1. Go to your GitHub repo: https://github.com/andriihuk-ns/udo-craft
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these 4 secrets:

| Secret Name | Value |
|---|---|
| `VERCEL_TOKEN` | Paste the token from Step 1 |
| `VERCEL_ORG_ID` | `team_XX3rqg5IE2XdK6oxIVibJTt6` |
| `VERCEL_ADMIN_PROJECT_ID` | `prj_uNMByvkPtFNKthWbXcbTTdDOvIt2` |
| `VERCEL_CLIENT_PROJECT_ID` | `prj_GTScm9WnDiwD837rrOKHsXiFRsFS` |

## Step 3: Deploy

Once secrets are added, deployment happens automatically:

- **Push to `main`** → Deploys both apps to production
- **Push to `develop`** → Deploys to staging

Or manually trigger:
```bash
git push origin main
```

## What Happens During Deployment

The GitHub Actions workflow will:
1. Checkout your code
2. Install dependencies with `npm ci`
3. Build both apps
4. Deploy admin to `admin.u-do-craft.store`
5. Deploy client to `u-do-craft.store`

## Monitor Deployment

1. Go to https://github.com/andriihuk-ns/udo-craft/actions
2. Click the latest workflow run to see logs
3. Once complete, your apps will be live

## Troubleshooting

If deployment fails:
- Check the workflow logs for errors
- Verify all 4 secrets are set correctly
- Ensure Vercel token is valid and not expired

## Current Changes Ready to Deploy

✓ Fixed `onLayerDuplicate` ref issue in ProductCanvas
✓ Updated Vercel configs
✓ All TypeScript diagnostics pass

Just push to main to deploy!

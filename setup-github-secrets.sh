#!/bin/bash

# GitHub Secrets Setup Script
# This script adds the required secrets to your GitHub repository

set -e

echo "🚀 GitHub Secrets Setup for udo-craft"
echo "======================================"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "Install it from: https://cli.github.com"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub"
    echo "Run: gh auth login"
    exit 1
fi

echo "✓ GitHub CLI authenticated"
echo ""

# Get Vercel token from user
echo "📝 You need your Vercel token to continue"
echo "Get it from: https://vercel.com/account/tokens"
echo ""
read -sp "Enter your Vercel token: " VERCEL_TOKEN
echo ""

if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ Vercel token is required"
    exit 1
fi

echo ""
echo "Adding secrets to GitHub..."
echo ""

# Add secrets
gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN" && echo "✓ VERCEL_TOKEN added"
gh secret set VERCEL_ORG_ID --body "team_XX3rqg5IE2XdK6oxIVibJTt6" && echo "✓ VERCEL_ORG_ID added"
gh secret set VERCEL_ADMIN_PROJECT_ID --body "prj_uNMByvkPtFNKthWbXcbTTdDOvIt2" && echo "✓ VERCEL_ADMIN_PROJECT_ID added"
gh secret set VERCEL_CLIENT_PROJECT_ID --body "prj_GTScm9WnDiwD837rrOKHsXiFRsFS" && echo "✓ VERCEL_CLIENT_PROJECT_ID added"

echo ""
echo "✅ All secrets added successfully!"
echo ""
echo "🚀 Ready to deploy! Push to main:"
echo "   git push origin main"
echo ""
echo "Monitor deployment at:"
echo "   https://github.com/andriihuk-ns/udo-craft/actions"

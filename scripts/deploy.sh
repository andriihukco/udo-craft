#!/bin/bash

# U:DO Craft Deployment Script
# Deploys admin and client apps to Vercel without manual project.json manipulation

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-}"
VERCEL_ORG_ID="team_XX3rqg5IE2XdK6oxIVibJTt6"
VERCEL_ADMIN_PROJECT_ID="prj_uNMByvkPtFNKthWbXcbTTdDOvIt2"
VERCEL_CLIENT_PROJECT_ID="prj_GTScm9WnDiwD837rrOKHsXiFRsFS"

if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ Error: VERCEL_TOKEN environment variable not set"
  echo "Set it with: export VERCEL_TOKEN=your_token"
  exit 1
fi

echo "🚀 U:DO Craft Deployment"
echo "========================"
echo ""

# Determine what to deploy
DEPLOY_ADMIN=${1:-"both"}
DEPLOY_CLIENT=${1:-"both"}

if [ "$1" = "admin" ]; then
  DEPLOY_CLIENT="no"
elif [ "$1" = "client" ]; then
  DEPLOY_ADMIN="no"
fi

# Deploy Admin
if [ "$DEPLOY_ADMIN" != "no" ]; then
  echo "📦 Deploying Admin..."
  cd apps/admin
  vercel deploy --prod --yes \
    --token "$VERCEL_TOKEN" \
    --scope "$VERCEL_ORG_ID" \
    --project-id "$VERCEL_ADMIN_PROJECT_ID"
  cd ../..
  echo "✅ Admin deployed"
  echo ""
fi

# Deploy Client
if [ "$DEPLOY_CLIENT" != "no" ]; then
  echo "📦 Deploying Client..."
  cd apps/client
  vercel deploy --prod --yes \
    --token "$VERCEL_TOKEN" \
    --scope "$VERCEL_ORG_ID" \
    --project-id "$VERCEL_CLIENT_PROJECT_ID"
  cd ../..
  echo "✅ Client deployed"
  echo ""
fi

echo "🎉 Deployment complete!"
echo ""
echo "Admin:  https://admin.u-do-craft.store"
echo "Client: https://www.u-do-craft.store"

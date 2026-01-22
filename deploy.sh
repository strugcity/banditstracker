#!/bin/bash
export SUPABASE_ACCESS_TOKEN="sbp_v0_5281f496aa2b4ac3b704715c6b5ef53da39772d7"

echo "Deploying analyze-video function..."
npx supabase functions deploy analyze-video --project-ref xaknhwxfkcxtqjkwkccn --use-api --yes

echo ""
echo "Deploying extract-frames function..."
npx supabase functions deploy extract-frames --project-ref xaknhwxfkcxtqjkwkccn --use-api --yes

echo ""
echo "Deployment complete!"

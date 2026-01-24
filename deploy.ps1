# PowerShell Deployment Script for Supabase Video Analysis Service

$env:SUPABASE_ACCESS_TOKEN = "sbp_v0_5281f496aa2b4ac3b704715c6b5ef53da39772d7"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Deploying Video Analysis Edge Functions" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Deploy analyze-video function
Write-Host "1. Deploying analyze-video function..." -ForegroundColor Yellow
npx supabase functions deploy analyze-video --project-ref xaknhwxfkcxtqjkwkccn --use-api --yes
Write-Host ""

# Deploy extract-frames function
Write-Host "2. Deploying extract-frames function..." -ForegroundColor Yellow
npx supabase functions deploy extract-frames --project-ref xaknhwxfkcxtqjkwkccn --use-api --yes
Write-Host ""

# Set Gemini API key secret
Write-Host "3. Setting Gemini API key secret..." -ForegroundColor Yellow
npx supabase secrets set GEMINI_API_KEY="AIzaSyDMJqf3KrqMzP6JzinsO5PvNzz241bNA-0" --project-ref xaknhwxfkcxtqjkwkccn
Write-Host ""

Write-Host "======================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run the database migration (requires DB password)" -ForegroundColor White
Write-Host "2. Test the functions" -ForegroundColor White

# CI/CD Setup Guide - Vercel + GitHub
## Automated Deployment Pipeline

**Last Updated**: 2026-01-21
**Stack**: Vite + Supabase + Vercel + GitHub

---

## Overview

This guide walks through setting up a complete CI/CD pipeline where:
- Every push to a branch creates a preview deployment
- Every merge to `main` deploys to production
- Everything happens automatically (no manual deploys)

---

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [GitHub Configuration](#github-configuration)
3. [Vercel Configuration](#vercel-configuration)
4. [Environment Management](#environment-management)
5. [Deployment Workflow](#deployment-workflow)
6. [Monitoring & Debugging](#monitoring--debugging)
7. [Advanced Configuration](#advanced-configuration)

---

## Initial Setup

### Prerequisites

✅ GitHub account with repository
✅ Vercel account (free tier works)
✅ Project using Vite/React
✅ Supabase project created

### One-Time Vercel Setup

**Step 1: Connect GitHub to Vercel**

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" or "Log In"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub repos

**Step 2: Import Project**

1. Click "Add New..." → "Project"
2. Find your repository (`strugcity/banditstracker`)
3. Click "Import"

**Step 3: Configure Build Settings**

Vercel should auto-detect Vite, but verify:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Node Version: 18.x (or latest LTS)
```

**Step 4: Add Environment Variables**

Click "Environment Variables" and add:

```
VITE_SUPABASE_URL = https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY = your-anon-key-here
```

**For each variable, select environments**:
- ✅ Production
- ✅ Preview
- ✅ Development (optional)

**Step 5: Deploy**

1. Click "Deploy"
2. Wait 1-2 minutes for first build
3. You'll get a production URL: `https://banditstracker.vercel.app`

**🎉 Done! Your CI/CD pipeline is now active.**

---

## GitHub Configuration

### Branch Protection Rules (Recommended)

Protect your `main` branch from accidental direct commits:

**Setup** (GitHub.com → Your Repo → Settings → Branches):

1. Click "Add rule"
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require approvals: 1 (or 0 if solo)
   - ✅ Require status checks to pass before merging
     - Select: Vercel deployment check
   - ✅ Require branches to be up to date before merging

**What this does**:
- ❌ Can't push directly to `main`
- ✅ Must create PR
- ✅ Must wait for Vercel build to succeed
- ✅ Keeps main branch always deployable

### GitHub Actions (Optional Enhancement)

Add automated checks beyond Vercel:

**`.github/workflows/ci.yml`**:
```yaml
name: CI Checks

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Build
        run: npm run build

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
```

**Add to package.json**:
```json
{
  "scripts": {
    "type-check": "tsc --noEmit"
  }
}
```

---

## Vercel Configuration

### Project Settings

**Domains** (Settings → Domains):
```
Production:
  - banditstracker.vercel.app (auto-generated)
  - yourdomain.com (custom domain if you buy one)

Preview:
  - Auto-generated per branch
  - Format: banditstracker-git-<branch>-<hash>.vercel.app
```

**Git Configuration** (Settings → Git):
```yaml
Production Branch: main
Automatically deploy new commits: ✅ Enabled
Preview deployments: ✅ Enabled for all branches
Ignored Build Step: (leave empty for now)
```

### Build & Development Settings

```yaml
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Development Command: npm run dev

Root Directory: ./
Environment Variables: (see below)
Node.js Version: 18.x
```

### Advanced Build Configuration

**`vercel.json`** (optional, at project root):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "outputDirectory": "dist",

  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },

  "regions": ["iad1"],

  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],

  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    }
  ]
}
```

---

## Environment Management

### Three-Environment Strategy

| Environment | Branch | URL Pattern | Database | Purpose |
|-------------|--------|-------------|----------|---------|
| **Local** | Any | localhost:5173 | Supabase Dev | Development |
| **Preview/Staging** | Feature branches | *-git-feature-*.vercel.app | Supabase Prod¹ | Testing |
| **Production** | main | banditstracker.vercel.app | Supabase Prod | Live |

¹ *Ideally separate staging database, but can share with production initially*

### Environment Variables

**Vercel Dashboard Setup**:

1. Project Settings → Environment Variables

**Production Variables**:
```bash
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
# Check: ✅ Production
```

**Preview Variables** (same as prod for now):
```bash
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
# Check: ✅ Preview
```

**Development Variables** (optional):
```bash
# Check: ✅ Development
# These are available via `vercel dev` command
```

**Local Variables** (`.env.local` file, **NOT** committed):
```bash
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Separate Staging Database (Advanced)

**When to do this**: When you want to test database migrations without affecting production

**Setup**:

1. Create second Supabase project (e.g., `banditstracker-staging`)
2. Set preview environment variables differently:

```bash
# Preview Environment
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=staging-key...

# Production Environment
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod-key...
```

3. Run migrations in staging first, test, then run in production

---

## Deployment Workflow

### Automatic Deployments

**What triggers a deployment?**

| Action | Triggers | Deployment Type | URL |
|--------|----------|-----------------|-----|
| Push to `main` | ✅ Immediate | Production | banditstracker.vercel.app |
| Push to feature branch | ✅ Immediate | Preview | *-git-feature-*.vercel.app |
| Create PR | ✅ Immediate | Preview | Comment added to PR |
| Update PR | ✅ Immediate | Preview (updates) | Same URL, rebuilt |
| Merge PR | ✅ Immediate | Production | banditstracker.vercel.app |

**What does NOT trigger deployment?**

- ❌ Commits to `.md` files (if you configure ignored patterns)
- ❌ Draft PRs (if you configure to skip)
- ❌ Local commits (before push)

### Manual Deployments

**When you might need manual deploy**:
- Redeploy without code changes (env var update)
- Rollback to previous version
- Deploy specific commit

**Via Vercel Dashboard**:

1. Go to Deployments tab
2. Find desired deployment
3. Click "..." → Options:
   - **Redeploy**: Build again (useful after env var change)
   - **Promote to Production**: Make this the production version
   - **View Deployment**: See the preview
   - **View Logs**: Debug build issues

**Via Vercel CLI** (advanced):

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy current directory
vercel

# Deploy to production
vercel --prod

# Redeploy latest
vercel deploy --force
```

### Deployment Logs

**Where to find them**:

1. Vercel Dashboard → Deployments → Click deployment
2. Tabs available:
   - **Building**: Real-time build output
   - **Runtime Logs**: Live application logs
   - **Functions**: Serverless function logs (if applicable)

**Reading build logs**:

```
Build started...
├─ Installing dependencies
│  └─ npm install ... ✓
├─ Running build command
│  └─ npm run build
│     ├─ vite v4.x.x building for production...
│     ├─ transforming (245 files)...
│     ├─ rendering chunks...
│     └─ dist/index.html ... ✓
└─ Build completed in 45s

Deploying...
└─ Deployment ready: https://...
```

**Common errors**:

```
❌ "Module not found"
   → Missing dependency in package.json
   → Run: npm install <package> --save

❌ "Type error: ..."
   → TypeScript compilation failed
   → Fix types locally, test with: npm run build

❌ "Command failed: npm run build"
   → Build script error
   → Check local build: npm run build
```

---

## Monitoring & Debugging

### Vercel Analytics (Free)

**Enable**:
1. Project Settings → Analytics
2. Toggle "Enable Web Analytics"

**What you get**:
- Page views
- Top pages
- Visitor countries
- Device types

### Performance Monitoring

**Vercel Speed Insights** (Free):

```bash
npm install @vercel/speed-insights
```

**`src/main.tsx`**:
```typescript
import { SpeedInsights } from '@vercel/speed-insights/react'

// Add to your app
<SpeedInsights />
```

### Error Monitoring (Third-party)

**Option 1: Sentry** (recommended for serious projects)

```bash
npm install @sentry/react @sentry/vite-plugin
```

**`vite.config.ts`**:
```typescript
import { sentryVitePlugin } from "@sentry/vite-plugin"

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "your-org",
      project: "banditstracker"
    })
  ]
})
```

**`src/main.tsx`**:
```typescript
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
})
```

### Deployment Notifications

**Slack Integration**:

1. Vercel Dashboard → Settings → Integrations
2. Add "Slack"
3. Choose channel
4. Get notifications for:
   - ✅ Successful deploys
   - ❌ Failed builds
   - 📊 Preview deployments

**GitHub Checks**:
- Automatically enabled
- Green checkmark = success
- Red X = failure
- Click for logs

---

## Advanced Configuration

### Monorepo Support (Future)

If you split into frontend/backend:

```json
// vercel.json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "cd frontend && npm install"
}
```

### Preview Branch Patterns

**Deploy only specific branches**:

```json
// vercel.json
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "feature/*": true,
      "staging": true
    }
  }
}
```

### Custom Build Commands

**Skip builds for docs changes**:

```json
// vercel.json
{
  "ignoreCommand": "git diff --quiet HEAD^ HEAD ./**/*.{ts,tsx,js,jsx,css}"
}
```

This skips deployment if only non-code files changed.

### Serverless Functions (Future)

If you add API routes:

**`/api/hello.ts`**:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ message: 'Hello from Vercel!' })
}
```

Accessible at: `https://yourdomain.vercel.app/api/hello`

### Cron Jobs (Vercel Cron)

**`vercel.json`**:
```json
{
  "crons": [{
    "path": "/api/daily-backup",
    "schedule": "0 2 * * *"
  }]
}
```

Runs daily at 2 AM UTC.

---

## Troubleshooting

### Build Fails in Vercel but Works Locally

**Possible causes**:

1. **Environment variable missing**
   - Check Vercel → Settings → Environment Variables
   - Ensure marked for "Production" and/or "Preview"

2. **Different Node version**
   - Vercel uses Node 18 by default
   - Check locally: `node --version`
   - Set in Vercel: Settings → General → Node.js Version

3. **TypeScript strict mode**
   - Vercel runs `tsc` with strict checks
   - Test locally: `npm run build` (not `npm run dev`)

4. **Missing dependencies**
   - Check `package.json` vs `package-lock.json`
   - Ensure all imports are in dependencies (not devDependencies if used in build)

### Preview Deployment Not Created

**Checks**:

1. Is the repository connected in Vercel?
2. Is "Preview Deployments" enabled? (Settings → Git)
3. Did the branch push successfully to GitHub?
4. Check Vercel → Deployments for error logs

### Environment Variable Not Working

**Debug**:

```typescript
// Add temporary logging (remove before commit!)
console.log('Env vars:', {
  url: import.meta.env.VITE_SUPABASE_URL,
  hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
})
```

**Common mistakes**:
- ❌ Variable not prefixed with `VITE_`
- ❌ Not marked for correct environment (Production/Preview)
- ❌ Quotes in Vercel UI (don't use quotes!)
- ❌ Cached - try redeploying: Deployments → Redeploy

### Deployment Succeeded but App Broken

**Check browser console**:
1. Right-click → Inspect → Console tab
2. Look for errors

**Common issues**:
- API calls failing (wrong Supabase URL)
- Routes not working (check Vite SPA fallback)
- Assets 404 (check build output directory)

**Vercel routing for SPAs**:

Create `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This ensures all routes go to your app (client-side routing works).

---

## Security Best Practices

### Secrets Management

**DO**:
- ✅ Store secrets in Vercel environment variables
- ✅ Use different keys for preview vs production
- ✅ Rotate keys periodically
- ✅ Use `.env.local` locally (gitignored)

**DON'T**:
- ❌ Commit `.env` files to git
- ❌ Hardcode secrets in code
- ❌ Share secrets in Slack/email
- ❌ Use same production keys in preview

### Environment Variable Security

**Public variables** (prefixed `VITE_`):
- Exposed to browser
- Can be seen by users
- OK for: API URLs, public keys

**Private variables** (no prefix):
- Server-side only (if using API routes)
- Never exposed to browser
- Use for: Secret keys, passwords

**Check `.gitignore`**:
```bash
# Environment variables
.env
.env.local
.env.*.local

# Vercel
.vercel
```

---

## Cost Optimization

### Vercel Free Tier Limits

```
✅ Unlimited deployments
✅ Unlimited preview deployments
✅ 100 GB bandwidth/month
✅ Serverless function execution: 100 GB-hours

Usually sufficient for:
- Solo projects
- Small teams
- Up to ~10k monthly visitors
```

**If you exceed**:
- Upgrade to Pro ($20/month)
- Or optimize (see below)

### Reducing Build Time (Faster = Cheaper)

**1. Dependency caching** (automatic in Vercel)

**2. Smaller builds**:
```bash
# Analyze bundle size
npm install -D rollup-plugin-visualizer

# vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

plugins: [
  visualizer({ open: true })
]

# Run build, opens bundle analysis
npm run build
```

**3. Skip unnecessary builds**:
```json
// vercel.json
{
  "ignoreCommand": "git diff --quiet HEAD^ HEAD './src/**/*'"
}
```

---

## Summary

### What You've Set Up

✅ **Automatic deployments** from GitHub to Vercel
✅ **Preview environments** for every PR
✅ **Production deployments** on merge to main
✅ **Environment isolation** (local, preview, production)
✅ **Zero-downtime deployments**
✅ **Automatic rollback capability**

### Next Steps

1. Set up branch protection on GitHub
2. Add monitoring (Vercel Analytics + Sentry)
3. Configure deployment notifications (Slack)
4. Create separate staging database
5. Add automated tests in GitHub Actions

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Vercel Support: support@vercel.com
- GitHub Discussions: Create in your repo

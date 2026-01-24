# Complete Operations Guide - Bandits Training Tracker
## All-in-One Documentation for Easy Sharing

**Last Updated**: 2026-01-21
**Version**: 1.0.0
**Repository**: github.com/strugcity/banditstracker

---

> 📥 **DOWNLOAD THIS FILE**: This is a standalone document containing ALL operational procedures.
> You can share this single file with team members, contractors, or keep it for reference.

---

# Table of Contents

1. [Quick Start](#quick-start)
2. [Git Fundamentals](#git-fundamentals)
3. [Environment Strategy](#environment-strategy)
4. [Daily Development Workflow](#daily-development-workflow)
5. [CI/CD with Vercel](#cicd-with-vercel)
6. [Database Migrations](#database-migrations)
7. [Quick Reference Commands](#quick-reference-commands)
8. [Emergency Procedures](#emergency-procedures)
9. [Troubleshooting](#troubleshooting)

---

# Quick Start

## For Absolute Beginners

**What you need to know right now:**

1. **Git** is like a time machine for your code
2. **Branches** let you experiment without breaking the main code
3. **Commits** are save points you can return to
4. **Pull Requests (PRs)** are how you get code reviewed before it goes live
5. **Three environments**: Local (your PC), Staging (preview), Production (live site)

## Your First Feature

```bash
# 1. Get latest code
git checkout main
git pull origin main

# 2. Create your feature branch
git checkout -b feature/my-first-feature

# 3. Make your changes
# (edit files in VS Code...)

# 4. Save your work
git add .
git commit -m "feat: Add my first feature"

# 5. Push to GitHub
git push origin feature/my-first-feature

# 6. Create PR on GitHub.com → Merge when ready
# 7. Your code is automatically deployed to production!
```

**Congratulations!** You just completed a full development cycle.

---

# Git Fundamentals

## What is Git?

Git is version control software that:
- Tracks every change to your code
- Lets you go back to any previous version
- Enables multiple people to work on the same code
- Prevents you from overwriting someone else's work

**Think of it as**: Google Docs version history, but for code.

## Core Concepts

### Commit 📸

**What**: A snapshot of your code at a specific moment
**Why**: Creates a restore point
**Analogy**: Saving a game checkpoint

```bash
git add .                    # Prepare files
git commit -m "Fix bug"      # Create checkpoint
```

### Branch 🌿

**What**: An independent line of development
**Why**: Work on features without breaking main code
**Analogy**: Parallel universe for experiments

```bash
git checkout -b feature/timer   # Create branch
# Make changes...
# Main code stays untouched!
```

### Pull Request (PR) 🔍

**What**: Request to merge your branch into main
**Why**: Review code before it goes live
**Analogy**: Submitting a draft for approval

```bash
git push origin feature/timer   # Push branch
# Create PR on GitHub
# Team reviews
# Merge when approved
```

### Merge 🔀

**What**: Combining changes from one branch into another
**Why**: Integrates completed work into main codebase
**Analogy**: Publishing your approved draft

```bash
# Usually done via GitHub UI
# Click "Merge Pull Request"
```

## Branch Naming

Use descriptive prefixes:

```
feature/workout-timer        → New features
fix/login-error              → Bug fixes
hotfix/security-patch        → Urgent production fixes
docs/setup-guide             → Documentation
refactor/query-optimization  → Code improvements
test/auth-integration        → Tests
chore/update-deps            → Maintenance
```

## Commit Messages

**Good format**:
```
type: Short summary (50 chars max)

Detailed explanation of what changed and why.
```

**Examples**:

✅ **Good**:
```
feat: Add workout timer component

Created Timer component with pause/resume functionality
for tracking rest periods between sets.
```

```
fix: Prevent null athleteId in workout sessions

Added validation to ensure athleteId is always provided,
preventing orphaned records in the database.
```

❌ **Bad**:
```
fixed stuff
wip
asdfasdf
updated everything
```

## Essential Git Commands

```bash
# Check status
git status                      # What changed?
git diff                        # Show changes in files

# Branches
git branch                      # List branches
git checkout -b branch-name     # Create new branch
git checkout branch-name        # Switch branches
git branch -d branch-name       # Delete branch

# Saving work
git add .                       # Stage all changes
git add file.ts                 # Stage specific file
git commit -m "message"         # Save checkpoint

# Syncing
git pull origin main            # Get latest from GitHub
git push origin branch-name     # Send to GitHub

# Undo
git checkout -- file.ts         # Undo changes to file
git reset --soft HEAD~1         # Undo last commit (keep changes)
git reset --hard HEAD~1         # Undo last commit (discard changes) ⚠️

# History
git log                         # Show commits
git log --oneline               # Compact history
```

---

# Environment Strategy

## Three-Tier Model

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   LOCAL     │  →   │   STAGING   │  →   │ PRODUCTION  │
│ Development │      │   Testing   │      │    Live     │
└─────────────┘      └─────────────┘      └─────────────┘
   Your PC          Vercel Preview       Vercel Production
   localhost:5173    preview-xyz.vercel   banditstracker.com
```

### LOCAL (Your Computer)

**URL**: `http://localhost:5173`
**Database**: Supabase (shared)
**Purpose**: Write and test code

**Characteristics**:
- ✅ Instant feedback (hot reload)
- ✅ Break things safely
- ✅ Full debugging tools
- ⚠️ Only you can see it

**When to use**: Writing code, experimenting, debugging

**How to run**:
```bash
npm run dev
```

### STAGING (Preview Deployments)

**URL**: `https://banditstracker-git-feature-*.vercel.app`
**Database**: Supabase production
**Purpose**: Test in production-like environment

**Characteristics**:
- ✅ Real production environment
- ✅ Shareable URL
- ✅ Automatic on every PR
- ✅ Test on real mobile devices

**When to use**: Before merging to production, sharing with testers

**How it works**: Automatic when you create a PR

### PRODUCTION (Live Site)

**URL**: `https://banditstracker.vercel.app`
**Database**: Supabase production
**Purpose**: Real users

**Characteristics**:
- ✅ Real users access this
- ✅ Must be stable
- ⚠️ Changes affect real data

**When to use**: Only after testing in staging

**How it works**: Automatic when you merge to `main`

## Key Difference: Local vs Cloud

```
┌─────────────────┐         ┌──────────────────┐
│  LOCAL CODE     │         │  CLOUD DATABASE  │
│  (Your PC)      │    ✗    │  (Supabase)      │
│                 │  NOT    │                  │
│  Files change   │  AUTO   │  Database stays  │
│  instantly      │  SYNC   │  the same!       │
└─────────────────┘         └──────────────────┘
```

**IMPORTANT**: When you pull code changes, the database does NOT automatically update.
You must manually run migrations!

---

# Daily Development Workflow

## The Complete Cycle

### Step 1: Start Your Day

```bash
# Get latest code
git checkout main
git pull origin main
npm install  # In case dependencies changed
```

### Step 2: Create Feature Branch

```bash
git checkout -b feature/your-feature-name
git branch  # Verify you're on the new branch
```

### Step 3: Develop Locally

```bash
npm run dev  # Start dev server
# Open http://localhost:5173
# Make changes, test in browser
```

**Make frequent commits**:
```bash
git add .
git commit -m "Add timer UI component"
# Continue working...
git add .
git commit -m "Add timer logic"
```

### Step 4: Test Locally

```bash
npm run build   # Check for errors
npm run lint    # Check code style
# Test in browser manually
```

### Step 5: Push to GitHub

```bash
# First push
git push -u origin feature/your-feature-name

# Later pushes
git push
```

**What happens**: Vercel automatically builds a preview deployment (~2 min)

### Step 6: Create Pull Request

On GitHub.com:
1. Click "Compare & pull request"
2. Fill description:
   ```
   ## What does this PR do?
   Adds workout timer with pause/resume

   ## How to test
   1. Start workout
   2. Complete a set
   3. Timer counts down

   ## Checklist
   - [x] Tested locally
   - [x] No console errors
   - [x] Works on mobile
   ```
3. Create PR

### Step 7: Test Staging

1. Click Vercel preview link in PR
2. Test feature on preview URL
3. Test on mobile phone
4. Fix issues if needed (push again, preview updates)

### Step 8: Merge to Production

1. Click "Merge pull request"
2. Choose "Squash and merge"
3. Confirm

**What happens**: Vercel automatically deploys to production (~2 min)

### Step 9: Verify Production

1. Visit production URL
2. Test the feature
3. Monitor for errors

### Step 10: Clean Up

```bash
git checkout main
git pull origin main
git branch -d feature/your-feature-name  # Delete local branch
```

---

# CI/CD with Vercel

## What is CI/CD?

**CI (Continuous Integration)**: Automatically test/build when you push code
**CD (Continuous Deployment)**: Automatically deploy built code

**In simple terms**: Vercel watches your GitHub repo and deploys automatically.

## How It Works

```
┌──────────────────────────────────────────────────────────┐
│  AUTOMATIC WORKFLOW                                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. You: git push origin feature/timer                  │
│          ↓                                               │
│  2. GitHub: Receives code, notifies Vercel              │
│          ↓                                               │
│  3. Vercel: Detects push, starts build                  │
│          ├─→ npm install                                 │
│          ├─→ npm run build                               │
│          └─→ Creates preview deployment                  │
│          ↓                                               │
│  4. Vercel: Comments on PR with preview URL             │
│          ↓                                               │
│  5. You: Test preview, merge PR                         │
│          ↓                                               │
│  6. Vercel: Detects main update, deploys production     │
│          ↓                                               │
│  7. Production: Live! 🎉                                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Deployment Rules

| Branch | Deploys To | Automatic? | URL |
|--------|-----------|------------|-----|
| `main` | Production | ✅ Yes | banditstracker.vercel.app |
| Feature branches | Preview | ✅ Yes | *-git-feature-*.vercel.app |
| Local changes | Nowhere | - | localhost:5173 |

## Initial Vercel Setup

**One-time setup** (if not done already):

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Import repository: `strugcity/banditstracker`
4. Configure:
   ```
   Framework: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```
5. Add environment variables:
   ```
   VITE_SUPABASE_URL = https://yourproject.supabase.co
   VITE_SUPABASE_ANON_KEY = your-anon-key
   ```
   (Check: ✅ Production, ✅ Preview)
6. Deploy!

## Monitoring Deployments

**Via Vercel Dashboard**:
- See all deployments
- Check build logs
- View runtime logs

**Via GitHub**:
- Green ✅ = deployed
- Red ❌ = build failed (click for logs)

## Common Build Failures

**"Module not found"**:
```bash
npm install <missing-package> --save
git add package.json package-lock.json
git commit -m "Add missing dependency"
git push
```

**TypeScript errors**:
```bash
# Fix locally first
npm run build  # Must succeed
```

**Environment variable missing**:
- Add in Vercel Dashboard → Settings → Environment Variables
- Redeploy latest deployment

---

# Database Migrations

## What Are Migrations?

**Migrations** = Step-by-step instructions to change your database structure

They're like Git commits, but for your database schema.

**Example**: Adding a table, adding a column, changing a constraint

## Where They Live

```
supabase/migrations/
├── 001_initial_schema.sql
├── 002_add_teams.sql
├── ...
└── 009_enforce_athlete_id_not_null.sql
```

## Creating a Migration

**Method 1: Manual**
```bash
touch supabase/migrations/010_add_feature.sql
```

**Method 2: Supabase CLI**
```bash
supabase migration new add_feature
```

## Writing Migrations

**Template**:
```sql
-- Migration: 010_add_workout_templates.sql
-- Description: Add workout templates feature

-- Create table
CREATE TABLE IF NOT EXISTS workout_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can view templates"
    ON workout_templates FOR SELECT
    USING (true);

-- Verify
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_name = 'workout_templates') THEN
        RAISE NOTICE 'SUCCESS: Table created';
    END IF;
END $$;
```

## Running Migrations

**CRITICAL**: Code auto-syncs, database does NOT!

### Locally (Test First!)

**Option 1: Supabase CLI**
```bash
supabase db push
```

**Option 2: Supabase Dashboard**
1. supabase.com → Your Project
2. SQL Editor
3. Paste migration SQL
4. Run

### Production (After Testing!)

**Safe process**:

1. **Test locally first**
2. **Create backup** (Supabase → Database → Backups → Create)
3. **Run migration** (Supabase SQL Editor)
4. **Verify** (Check tables exist)
5. **If broken**: Restore from backup

## Migration Best Practices

✅ **DO**:
- Test locally before production
- Back up database first
- Number migrations sequentially
- Include rollback instructions in comments
- Add verification checks

❌ **DON'T**:
- Modify old migrations
- Skip testing
- Run untested migrations in production
- Delete data without backups

---

# Quick Reference Commands

## Daily Git Workflow

```bash
# Morning routine
git checkout main
git pull origin main

# Start feature
git checkout -b feature/name

# Work and save
git add .
git commit -m "message"

# Push and create PR
git push origin feature/name
# Create PR on GitHub

# After merge
git checkout main
git pull origin main
```

## Common Git Commands

```bash
# Status
git status                  # What changed?
git diff                    # Show changes
git log --oneline          # History

# Branches
git branch                 # List branches
git checkout -b new-branch # Create branch
git checkout branch-name   # Switch branch
git branch -d branch-name  # Delete branch

# Undo
git checkout -- file.ts    # Undo file changes
git reset --soft HEAD~1    # Undo last commit
git stash                  # Save changes temporarily
git stash pop              # Restore stashed changes

# Sync
git pull origin main       # Get latest
git push origin branch     # Send to GitHub
```

## Development Commands

```bash
# Local development
npm install               # Install dependencies
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Check code style
npm run type-check       # Check TypeScript

# Testing
npm test                 # Run tests
npm test -- --watch      # Watch mode
```

## Deployment Commands

```bash
# Via Git (automatic)
git push origin main     # Deploy to production

# Via Vercel CLI (manual)
vercel                   # Deploy preview
vercel --prod           # Deploy production
```

## Database Commands

```bash
# Supabase CLI
supabase db push         # Run migrations
supabase db dump         # Backup database
supabase migration new   # Create migration
```

---

# Emergency Procedures

## Production is Down! 🚨

### Immediate Actions

**Step 1: STAY CALM**

**Step 2: Quick rollback**

**Via Vercel Dashboard**:
1. Deployments → Find last working deployment
2. "..." → "Promote to Production"
3. Live in 30 seconds

**Via Git**:
```bash
git revert HEAD
git push origin main
# Auto-deploys in 2 minutes
```

**Step 3: Verify**
- Visit production URL
- Test functionality
- Monitor for issues

**Step 4: Fix properly**
```bash
git checkout -b hotfix/production-fix
# Make fix
git commit -m "hotfix: Fix critical issue"
git push
# Create PR, merge when tested
```

## Bad Deployment

```bash
# Option 1: Vercel Dashboard rollback (fastest)
# Deployments → Previous good → Promote to Production

# Option 2: Git revert
git revert <bad-commit-hash>
git push origin main

# Option 3: Hard reset (emergency only!) ⚠️
git reset --hard <good-commit-hash>
git push --force origin main
```

## Database Corrupted

**Step 1: Stop the bleeding**
- Rollback app to version before corruption

**Step 2: Restore backup**
- Supabase → Database → Backups → Restore
- ⚠️ This overwrites current database!

**Step 3: Fix and redeploy**
- Fix the code/migration
- Test locally
- Deploy fix

## Deployment Stuck

```bash
# Check logs in Vercel Dashboard

# Common fixes:
# 1. Cancel and redeploy
# 2. Check environment variables
# 3. Check build logs for errors

# Nuclear option:
# Disconnect GitHub in Vercel → Reconnect
```

---

# Troubleshooting

## Local Development Issues

### Server Won't Start

```bash
# Check if port in use
lsof -i :5173
kill -9 <PID>

# Or use different port
npm run dev -- --port 3000
```

### Module Not Found

```bash
# Reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Fails

```bash
# Clean rebuild
rm -rf dist
npm run build

# Check TypeScript
npm run type-check
```

## Production Issues

### Check Browser Console

1. Right-click → Inspect
2. Console tab
3. Look for red errors

### Check Vercel Logs

1. Vercel Dashboard → Deployments
2. Click deployment
3. Runtime Logs tab

### Common Errors

**"Cannot read property of undefined"**:
```typescript
// Bad
user.profile.name

// Good
user?.profile?.name
```

**"Network request failed"**:
```typescript
// Check environment variables
console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
```

## Git Issues

### Merge Conflicts

```bash
# Abort merge
git merge --abort

# Or resolve conflicts
# 1. Edit files (remove <<<< ==== >>>> markers)
# 2. git add .
# 3. git commit
```

### Accidentally Committed to Main

```bash
# Move commits to new branch
git branch feature/forgot-to-branch
git reset --hard origin/main
git checkout feature/forgot-to-branch
```

### Lost Changes

```bash
# Find recent commits
git reflog

# Recover commit
git checkout <commit-hash>
```

---

# Checklists

## Before Every Commit

```
□ Code works locally
□ No console.log() or debugger statements
□ No commented-out code
□ No secrets/API keys
□ npm run build succeeds
□ npm run lint passes
□ Commit message is descriptive
```

## Before Creating PR

```
□ All commits are logical
□ Branch up to date with main
□ No merge conflicts
□ PR title and description clear
□ Self-reviewed code changes
□ Tested multiple screen sizes
□ No TypeScript errors
```

## Before Merging PR

```
□ CI checks pass (Vercel builds)
□ Preview deployment tested
□ Code reviewed
□ All comments addressed
□ No breaking changes
```

## Before Production Deployment

```
□ Staging tested
□ Mobile tested
□ Database migrations tested locally
□ Environment variables configured
□ Rollback plan ready
□ Ready to monitor for 15+ minutes
```

## Before Running Migration

```
□ Tested in local database
□ Rollback instructions documented
□ Production database backed up
□ Team notified (if applicable)
□ Verification queries written
```

---

# Glossary

**Branch** - Independent line of development
**CI/CD** - Continuous Integration / Continuous Deployment
**Commit** - Saved snapshot of code
**Deployment** - Publishing code to a server
**Environment** - Where code runs (local, staging, production)
**Merge** - Combining changes from branches
**Migration** - Database schema change script
**PR (Pull Request)** - Request to merge code with review
**Production** - Live environment users access
**RLS** - Row Level Security (database security policies)
**Rollback** - Reverting to previous version
**Staging** - Testing environment before production

---

# Quick Links

**Project**:
- Production: https://banditstracker.vercel.app
- GitHub: https://github.com/strugcity/banditstracker
- Vercel: https://vercel.com/dashboard
- Supabase: https://supabase.com/dashboard

**Docs**:
- React: https://react.dev
- Vite: https://vitejs.dev
- Supabase: https://supabase.com/docs
- Vercel: https://vercel.com/docs

**Help**:
- Git Guide: https://guides.github.com
- Git Cheat Sheet: https://education.github.com/git-cheat-sheet-education.pdf

---

# Summary

You now understand:

✅ **Git** - Commits, branches, PRs, merges
✅ **Environments** - Local, staging, production
✅ **Workflow** - Feature start → Development → Testing → Production
✅ **CI/CD** - Automatic deployments with Vercel
✅ **Migrations** - How to update the database safely
✅ **Emergencies** - How to rollback and recover

**Professional development practices** established!

---

**Document Version**: 1.0.0
**Last Updated**: 2026-01-21
**Maintained By**: Development Team
**License**: MIT (same as project)

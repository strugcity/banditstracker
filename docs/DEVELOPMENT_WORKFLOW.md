# Development Workflow & Operational Procedures
## Bandits Training Tracker - Complete Guide

**Last Updated**: 2026-01-21
**Status**: Active
**Audience**: Developers, Solo or Team

---

## Table of Contents

1. [Git Fundamentals](#1-git-fundamentals)
2. [Environment Strategy](#2-environment-strategy)
3. [Daily Development Workflow](#3-daily-development-workflow)
4. [CI/CD with Vercel](#4-cicd-with-vercel)
5. [Database Migrations](#5-database-migrations)
6. [Roles & Responsibilities](#6-roles--responsibilities)
7. [Emergency Procedures](#7-emergency-procedures)
8. [Checklists](#8-checklists)

---

## 1. Git Fundamentals

### What is Git? (Simple Explanation)

Think of Git as a **time machine for your code**. Every time you save a checkpoint (commit), you can go back to it later. It also lets multiple people work on the same project without overwriting each other's work.

### Key Concepts Explained

#### **Commit** 📸
- **What**: A snapshot of your code at a specific moment
- **Why**: Creates a restore point you can return to
- **When**: After completing a logical unit of work (bug fix, feature, etc.)
- **Analogy**: Like saving a game checkpoint

```bash
# Example: You fixed a bug
git add .                           # Stage the changes (prepare them)
git commit -m "Fix login bug"       # Create the checkpoint with a description
```

#### **Branch** 🌿
- **What**: An independent line of development
- **Why**: Lets you work on features without breaking the main code
- **When**: Always when starting new work
- **Analogy**: Like creating a parallel universe where you can experiment

```bash
# Example: Starting a new feature
git checkout -b feature/add-timer   # Create and switch to new branch
# Work on your feature...
# Main code (main branch) remains untouched!
```

#### **Pull Request (PR)** 🔍
- **What**: A request to merge your branch into another branch
- **Why**: Allows review before code goes live; creates discussion space
- **When**: When your feature is ready for review/deployment
- **Analogy**: Like submitting a draft for approval before publishing

```bash
# Example: You finished a feature
git push origin feature/add-timer   # Upload your branch to GitHub
# Then create PR on GitHub.com
```

#### **Merge** 🔀
- **What**: Combining changes from one branch into another
- **Why**: Integrates your completed work into the main codebase
- **When**: After PR is approved
- **Analogy**: Like publishing your approved draft

```bash
# Example: After PR approval
# (Usually done via GitHub UI, but can be command line)
git checkout main
git merge feature/add-timer
```

### Branch Naming Convention

Use descriptive prefixes:

```
feature/     → New features          (feature/workout-timer)
fix/         → Bug fixes             (fix/login-error)
hotfix/      → Urgent production fix (hotfix/security-patch)
docs/        → Documentation         (docs/api-guide)
refactor/    → Code improvements     (refactor/query-optimization)
test/        → Adding tests          (test/auth-integration)
chore/       → Maintenance           (chore/update-deps)
```

### Commit Message Best Practices

**Format**:
```
<type>: <short summary> (50 chars max)

<detailed description if needed>
<what changed and why>
```

**Good Examples**:
```
✅ fix: Prevent null athleteId in workout sessions

Added validation to createWorkoutSession() to ensure athleteId
is always provided, preventing orphaned records in the database.

✅ feat: Add workout timer component

Created new Timer component with pause/resume functionality
for tracking rest periods between sets.

✅ docs: Update security architecture guide

Added RLS policy documentation and penetration testing guide
based on recent QA audit findings.
```

**Bad Examples**:
```
❌ "fixed stuff"               (too vague)
❌ "wip"                        (not descriptive)
❌ "asdfasdf"                   (meaningless)
❌ "Fixed bug, added feature,
    updated docs, refactored
    code..."                    (too many things in one commit)
```

---

## 2. Environment Strategy

### Three-Tier Environment Model

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   LOCAL     │  →   │   STAGING   │  →   │ PRODUCTION  │
│ Development │      │   Testing   │      │    Live     │
└─────────────┘      └─────────────┘      └─────────────┘
   Your PC          Vercel Preview       Vercel Production
   localhost:5173    preview-xyz.vercel   banditstracker.com
```

### Environment Details

#### **LOCAL (Development)**

**Where**: Your personal computer
**Purpose**: Write and test code safely
**URL**: `http://localhost:5173` (Vite dev server)
**Database**: Supabase project (shared or dev-specific)

**Characteristics**:
- ✅ Fast feedback loop (instant reload)
- ✅ Can break things without consequence
- ✅ Full debugging tools
- ⚠️ Only you can see it
- ⚠️ Data changes affect shared database (be careful!)

**When to use**:
- Writing new code
- Trying experiments
- Debugging issues
- Learning new features

**How to run**:
```bash
cd /path/to/banditstracker
npm run dev
# Opens http://localhost:5173
```

#### **STAGING (Testing/Preview)**

**Where**: Vercel Preview Deployment
**Purpose**: Test code in a production-like environment
**URL**: `https://banditstracker-<branch>-<hash>.vercel.app`
**Database**: Supabase production (or separate staging DB)

**Characteristics**:
- ✅ Production-like environment
- ✅ Shareable URL (can send to testers)
- ✅ Automatic deployment on PR
- ⚠️ Slower than local (must deploy)
- ⚠️ May share database with production

**When to use**:
- Testing before production deployment
- Showing features to stakeholders
- QA testing
- Mobile device testing (real URL)

**How it works**:
- Automatically created when you push a branch
- Each PR gets its own preview URL
- Accessible via PR comments on GitHub

#### **PRODUCTION (Live)**

**Where**: Vercel Production Deployment
**Purpose**: The real app users interact with
**URL**: `https://banditstracker.vercel.app` (or custom domain)
**Database**: Supabase production project

**Characteristics**:
- ✅ Real users access this
- ✅ Best performance
- ✅ Monitored and backed up
- ⚠️ Must be stable (no breaking changes!)
- ⚠️ Changes affect real user data

**When to use**:
- Only after thorough testing in staging
- When code is reviewed and approved
- For official releases

**How it works**:
- Automatically deploys when you merge to `main` branch
- Protected by review process (PRs required)

### Environment Variables

Each environment needs its own configuration:

**Local** (`.env.local`):
```bash
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
# Add any other local-specific settings
```

**Staging/Production** (Vercel Dashboard):
- Set in Vercel project settings → Environment Variables
- Different values for preview vs production if needed
- Secrets (API keys) stored securely

---

## 3. Daily Development Workflow

### The Complete Cycle (Start to Finish)

#### **Step 1: Start Your Day (Pull Latest Changes)**

Before starting any work, get the latest code:

```bash
# Make sure you're on main branch
git checkout main

# Get latest changes from GitHub
git pull origin main

# Install any new dependencies
npm install
```

**Why?** Someone else might have made changes. You want to start from the latest code.

#### **Step 2: Create a Feature Branch**

Never work directly on `main`. Always create a branch:

```bash
# Create and switch to new branch
git checkout -b feature/your-feature-name

# Verify you're on the new branch
git branch
# Should show: * feature/your-feature-name
```

**Why?** Keeps main branch stable and lets you experiment safely.

#### **Step 3: Develop Locally**

Work on your feature:

```bash
# Start dev server
npm run dev

# Open http://localhost:5173 in browser
# Make your changes...
# Test in browser...
# Repeat until feature works!
```

**Pro tip**: Make small, frequent commits:

```bash
# After completing a small piece
git add .
git commit -m "Add timer UI component"

# Continue working...
git add .
git commit -m "Add timer logic and state management"

# Continue working...
git add .
git commit -m "Add timer tests"
```

**Why frequent commits?**
- Easy to undo if something breaks
- Clear history of what you did
- Can switch branches without losing work

#### **Step 4: Test Locally**

Before pushing, verify:

```bash
# Run build to check for errors
npm run build

# Run tests (if you have them)
npm test

# Run linter
npm run lint

# Test in browser manually
# - Try the new feature
# - Check existing features still work
# - Test on different screen sizes
```

#### **Step 5: Push to GitHub**

Send your branch to GitHub:

```bash
# First time pushing this branch
git push -u origin feature/your-feature-name

# Subsequent pushes (after more commits)
git push
```

**What happens?**
- Your code uploads to GitHub
- Vercel automatically detects the new branch
- Vercel builds and deploys a preview
- You get a preview URL in ~2 minutes

#### **Step 6: Create a Pull Request**

On GitHub.com:

1. Go to your repository
2. Click "Compare & pull request" (appears after push)
3. Fill out PR template:

```markdown
## What does this PR do?
Adds a workout timer that counts down rest periods between sets.

## How to test
1. Start a workout session
2. Complete a set
3. Timer should start counting down from default rest time
4. Can pause/resume timer

## Screenshots
[Add screenshots if UI changes]

## Checklist
- [x] Tested locally
- [x] No console errors
- [x] Works on mobile
- [x] Updated documentation (if needed)
```

4. Click "Create Pull Request"

#### **Step 7: Review and Test Staging**

**Self-review checklist**:
- Read through your code changes on GitHub
- Check for typos, console.logs, commented code
- Click the Vercel preview link
- Test the feature on the preview URL
- Test on your phone (preview URLs work on mobile!)

**If you find issues**:
```bash
# Fix the issues locally
git add .
git commit -m "Fix timer pause bug"
git push
# PR and preview update automatically!
```

#### **Step 8: Merge to Production**

When everything looks good:

1. Click "Merge pull request" on GitHub
2. Choose "Squash and merge" (keeps history clean)
3. Confirm merge
4. Delete the feature branch (GitHub offers this)

**What happens automatically**:
- Code merges into `main` branch
- Vercel detects main branch update
- Vercel deploys to production
- Your feature is live in ~2 minutes!

#### **Step 9: Verify Production**

After merge:

1. Visit production URL
2. Test the new feature
3. Check browser console for errors
4. Monitor for a few minutes

**If something breaks**:
- See [Emergency Procedures](#7-emergency-procedures)

#### **Step 10: Clean Up Locally**

After successful deployment:

```bash
# Switch back to main
git checkout main

# Pull the merged changes
git pull origin main

# Delete local feature branch (optional, but tidy)
git branch -d feature/your-feature-name

# You're ready for the next feature!
```

### Quick Reference: Common Git Commands

```bash
# See what branch you're on
git branch

# See what files changed
git status

# See what changed in files
git diff

# Undo changes to a file (before commit)
git checkout -- filename.ts

# Undo last commit (keeps changes)
git reset --soft HEAD~1

# Undo last commit (discards changes) ⚠️
git reset --hard HEAD~1

# Switch branches
git checkout branch-name

# Pull latest from GitHub
git pull origin main

# See commit history
git log --oneline

# See who changed what in a file
git blame filename.ts
```

---

## 4. CI/CD with Vercel

### What is CI/CD?

**CI (Continuous Integration)**: Automatically test and build code when changes are pushed
**CD (Continuous Deployment)**: Automatically deploy built code to servers

**In simple terms**: Vercel watches your GitHub repo and automatically deploys your code whenever you push.

### How Vercel Works with Your Repo

```
┌──────────────────────────────────────────────────────────┐
│  YOUR WORKFLOW                                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. You: git push origin feature/timer                  │
│          │                                               │
│          ▼                                               │
│  2. GitHub: Receives code, notifies Vercel              │
│          │                                               │
│          ▼                                               │
│  3. Vercel: Detects push, starts build                  │
│          │                                               │
│          ├─→ Runs: npm install                          │
│          ├─→ Runs: npm run build                        │
│          ├─→ Creates preview deployment                 │
│          │                                               │
│          ▼                                               │
│  4. Vercel: Comments on PR with preview URL             │
│          │                                               │
│          ▼                                               │
│  5. You: Test preview, merge PR                         │
│          │                                               │
│          ▼                                               │
│  6. Vercel: Detects main branch update                  │
│          │                                               │
│          ├─→ Runs: npm install                          │
│          ├─→ Runs: npm run build                        │
│          ├─→ Deploys to production                      │
│          │                                               │
│          ▼                                               │
│  7. Production: Feature live! 🎉                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Vercel Configuration

Your project has a `vercel.json` (or uses defaults):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  }
}
```

### Branch Deployment Rules

| Branch | Deploys To | Automatic? | URL |
|--------|-----------|------------|-----|
| `main` | Production | Yes | banditstracker.vercel.app |
| Feature branches | Preview | Yes | banditstracker-git-feature-*.vercel.app |
| Local changes | Nowhere | - | localhost:5173 |

### Monitoring Deployments

**Via Vercel Dashboard**:
1. Go to vercel.com → Your Project
2. See all deployments (production + previews)
3. Check build logs if deployment fails
4. View deployment analytics

**Via GitHub**:
1. Check PR comments for preview URLs
2. Green checkmark = deployed successfully
3. Red X = build failed (click for logs)

### Vercel Build Process

When Vercel builds your app:

```bash
# 1. Install dependencies
npm install

# 2. Build production bundle
npm run build
# Runs: vite build
# Creates: dist/ folder with optimized files

# 3. Deploy dist/ folder to CDN
# Your app is now live!
```

**Common build failures**:
- TypeScript errors (won't build if types are wrong)
- Missing environment variables
- Import errors (file not found)
- Dependencies not in package.json

**How to debug build failures**:
1. Check Vercel deployment logs
2. Run `npm run build` locally
3. Fix errors
4. Push again

---

## 5. Database Migrations

### What Are Migrations?

Migrations are **step-by-step instructions** to change your database structure. They're like Git commits, but for your database schema.

**Example**: Adding a new table, adding a column, changing a constraint

### Where Migrations Live

```
supabase/migrations/
├── 001_initial_schema.sql
├── 002_add_teams.sql
├── 003_add_programs.sql
├── ...
└── 009_enforce_athlete_id_not_null.sql
```

### Local vs Cloud Database

**IMPORTANT DIFFERENCE**:

```
┌─────────────────┐         ┌──────────────────┐
│  LOCAL CODE     │         │  CLOUD DATABASE  │
│  (Your PC)      │    ✗    │  (Supabase)      │
│                 │  NOT    │                  │
│  Files change   │  AUTO   │  Database stays  │
│  instantly      │  SYNC   │  the same!       │
└─────────────────┘         └──────────────────┘
```

**This means**: When you pull new code with a migration file, your database does NOT automatically update. You must manually run the migration.

### Migration Workflow

#### **Creating a Migration**

**Option 1: Local SQL file** (what we did)
```bash
# Create new migration file
touch supabase/migrations/010_add_new_table.sql

# Edit file with SQL commands
```

**Option 2: Supabase CLI**
```bash
supabase migration new add_new_table
# Creates numbered file automatically
```

#### **Writing Migrations**

Migrations should be:
- **Idempotent**: Safe to run multiple times
- **Reversible**: Document how to undo (if needed)
- **Tested**: Test locally first

**Example migration**:
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

-- Create policies
CREATE POLICY "Users can view templates"
    ON workout_templates FOR SELECT
    USING (true);

-- Verify
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_name = 'workout_templates') THEN
        RAISE NOTICE 'SUCCESS: workout_templates table created';
    ELSE
        RAISE EXCEPTION 'FAILED: workout_templates table not found';
    END IF;
END $$;
```

#### **Running Migrations Locally**

**Option 1: Supabase CLI** (recommended)
```bash
# Run all pending migrations
supabase db push

# Or run specific migration
supabase migration up
```

**Option 2: Supabase Dashboard**
1. Go to supabase.com → Your Project
2. Click "SQL Editor"
3. Paste migration SQL
4. Click "Run"

**Option 3: Direct SQL**
```bash
# If you have psql installed
psql $DATABASE_URL -f supabase/migrations/010_add_new_table.sql
```

#### **Running Migrations in Production**

**CRITICAL**: Always test migrations locally first!

**Safe deployment process**:

1. **Test locally**:
```bash
supabase db push
# Verify everything works
```

2. **Create database backup** (Supabase Dashboard):
   - Go to Database → Backups
   - Click "Create backup"
   - Wait for backup to complete

3. **Run migration in production**:
   - Supabase Dashboard → SQL Editor
   - Paste migration SQL
   - Review carefully
   - Click "Run"

4. **Verify**:
   - Check tables exist
   - Check data integrity
   - Test app functionality

5. **If something breaks**:
   - Restore from backup
   - Fix migration
   - Try again

### Migration Best Practices

✅ **DO**:
- Number migrations sequentially
- Include rollback instructions in comments
- Test locally before production
- Back up database before running in production
- Add verification checks (the DO $$ blocks)
- Document what the migration does

❌ **DON'T**:
- Modify old migrations (create new ones instead)
- Run migrations manually edited in production without testing
- Delete data without backups
- Skip migrations (run them in order)

### Common Migration Tasks

**Add a column**:
```sql
ALTER TABLE workout_sessions
    ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);
```

**Add an index**:
```sql
CREATE INDEX IF NOT EXISTS idx_sessions_athlete
    ON workout_sessions(athlete_id);
```

**Add a constraint**:
```sql
ALTER TABLE workout_sessions
    ALTER COLUMN athlete_id SET NOT NULL;
```

**Add RLS policy**:
```sql
CREATE POLICY "policy_name" ON table_name
    FOR SELECT USING (athlete_id = auth.uid());
```

---

## 6. Roles & Responsibilities

### Solo Developer (You Right Now)

When working alone, you wear all hats:

| Role | Responsibilities | Time Allocation |
|------|------------------|-----------------|
| **Developer** | Write code, fix bugs | 60% |
| **Reviewer** | Review your own code before merging | 10% |
| **DevOps** | Manage deployments, monitoring | 10% |
| **DBA** | Database migrations, backups | 10% |
| **QA** | Test features, find bugs | 10% |

**Best practices when solo**:
- Still use PRs (forces you to review code)
- Test in staging before production
- Document as you go (future you will thank you)
- Don't rush (stability > speed)

### Team Roles (Future)

When you expand to a team:

#### **Developer**
- Writes code in feature branches
- Creates PRs for review
- Responds to PR feedback
- Writes tests

#### **Code Reviewer**
- Reviews PRs from other developers
- Checks for bugs, security issues, style
- Approves or requests changes
- Should not be the same person as the developer

#### **Tech Lead / CTO**
- Defines architecture
- Makes technical decisions
- Reviews complex PRs
- Manages technical debt
- Plans sprints and features

#### **DevOps Engineer**
- Manages Vercel configuration
- Sets up monitoring and alerts
- Manages environment variables
- Handles production incidents

#### **Database Administrator (DBA)**
- Creates migrations
- Manages database performance
- Handles backups and restores
- Optimizes queries

#### **QA / Tester**
- Tests PRs in staging
- Creates test plans
- Reports bugs
- Verifies fixes

### Decision Matrix (Who Decides What)

| Decision | Solo | Small Team | Large Team |
|----------|------|------------|------------|
| Add a feature | You | Tech Lead | Product Manager + Tech Lead |
| Change DB schema | You | DBA + Tech Lead | DBA + Tech Lead + Architect |
| Deploy to production | You | Any developer (after PR) | DevOps + approval |
| Emergency rollback | You | On-call engineer | DevOps + Tech Lead |
| Architecture change | You | Team discussion | Architecture review board |

---

## 7. Emergency Procedures

### Production is Down! 🚨

**Step 1: STAY CALM**

**Step 2: Assess the situation**
- What's broken? (whole site? one feature?)
- When did it break? (check recent deployments)
- How many users affected?

**Step 3: Quick fix or rollback?**

**Option A: Rollback** (fastest, safest)

Via Vercel Dashboard:
1. Go to vercel.com → Your Project → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"
4. Site is back to working state in ~30 seconds

Via Git:
```bash
# Find the last good commit
git log --oneline

# Revert to that commit
git revert <commit-hash>
git push origin main
# Vercel auto-deploys
```

**Option B: Hotfix** (if you know the exact fix)

```bash
# Create hotfix branch from main
git checkout main
git pull
git checkout -b hotfix/fix-critical-bug

# Make the fix (ONE LINE if possible)
# Test locally
npm run build

# Commit and push
git add .
git commit -m "hotfix: Fix critical production bug"
git push origin hotfix/fix-critical-bug

# Create PR, merge immediately
# (Skip normal review process for critical issues)
```

**Step 4: Monitor**
- Watch Vercel deployment logs
- Test production URL
- Check error monitoring (if set up)

**Step 5: Post-mortem**
- What broke?
- Why did it break?
- How do we prevent this?
- Document in `docs/incidents/`

### Database is Corrupted! 🚨

**Step 1: Stop the bleeding**
- If app is writing bad data, deploy a version that disables the feature
- Or rollback to previous deployment

**Step 2: Assess damage**
```sql
-- Check for problematic data
SELECT COUNT(*) FROM workout_sessions WHERE athlete_id IS NULL;
```

**Step 3: Restore from backup**

Via Supabase Dashboard:
1. Database → Backups
2. Find backup from before corruption
3. Click "Restore"
4. ⚠️ **WARNING**: This overwrites current database!

**Step 4: Apply fix**
- Fix the code that caused corruption
- Deploy fix
- Test thoroughly

**Step 5: Manual data fix** (if restore not feasible)
```sql
-- Example: Fix orphaned records
UPDATE workout_sessions
SET athlete_id = (SELECT user_id FROM some_reference WHERE ...)
WHERE athlete_id IS NULL;
```

### Deployment Stuck/Failed

**Vercel deployment won't complete**:

1. Check build logs in Vercel dashboard
2. Common issues:
   - TypeScript errors → Fix and push
   - Missing env vars → Add in Vercel settings
   - Timeout → Large dependencies? Optimize

3. Cancel and retry:
   - Vercel Dashboard → Cancel deployment
   - Push a new commit (even trivial change)

4. Nuclear option:
   - Disconnect GitHub integration in Vercel
   - Reconnect and redeploy

---

## 8. Checklists

### Pre-Development Checklist

```
□ Pulled latest main branch
□ Installed dependencies (npm install)
□ Local dev server runs without errors
□ Created feature branch with descriptive name
□ Understand the feature requirements
```

### Pre-Commit Checklist

```
□ Code works locally
□ No console.log() or debugger statements
□ No commented-out code
□ No hardcoded secrets/API keys
□ Build succeeds (npm run build)
□ Linter passes (npm run lint)
□ Formatted code (Prettier/ESLint)
□ Commit message is descriptive
```

### Pre-PR Checklist

```
□ All commits are logical and well-described
□ Branch is up to date with main
□ No merge conflicts
□ PR title is descriptive
□ PR description explains what/why
□ Self-reviewed code changes on GitHub
□ Tested in browser (multiple screen sizes)
□ No TypeScript errors
```

### Pre-Merge Checklist

```
□ CI checks pass (Vercel build succeeds)
□ Preview deployment tested
□ Code reviewed (by teammate or self-review if solo)
□ All PR comments addressed
□ No breaking changes (or documented migration path)
□ Database migrations tested locally
```

### Pre-Migration Checklist

```
□ Migration tested in local database
□ Migration includes rollback instructions
□ Production database backed up
□ Downtime estimated (if any)
□ Team notified (if applicable)
□ Verification queries written
```

### Production Deployment Checklist

```
□ Staging environment tested
□ All tests pass
□ No console errors in browser
□ Tested on mobile device
□ Database migrations run successfully
□ Environment variables configured
□ Rollback plan documented
□ Monitoring in place
□ Ready to watch deployment for 15+ minutes
```

---

## Quick Start Guide

### First Time Setup

```bash
# 1. Clone repo
git clone https://github.com/strugcity/banditstracker.git
cd banditstracker

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Start dev server
npm run dev

# 5. Open browser
# Visit http://localhost:5173
```

### Daily Workflow (Quick Reference)

```bash
# Morning: Get latest code
git checkout main
git pull origin main

# Start new feature
git checkout -b feature/your-feature

# Work and commit frequently
# (make changes...)
git add .
git commit -m "Descriptive message"

# Push to GitHub
git push origin feature/your-feature

# Create PR on GitHub.com
# Test preview deployment
# Merge PR
# Feature goes live automatically!

# End of day: Clean up
git checkout main
git pull origin main
```

---

## Learning Resources

### Git
- [Git Handbook (GitHub)](https://guides.github.com/introduction/git-handbook/)
- [Learn Git Branching (Interactive)](https://learngitbranching.js.org/)

### Vercel
- [Vercel Documentation](https://vercel.com/docs)
- [Git Integration Guide](https://vercel.com/docs/concepts/git)

### General DevOps
- [The Twelve-Factor App](https://12factor.net/)
- [DevOps Roadmap](https://roadmap.sh/devops)

---

## Glossary

- **Branch**: An independent line of development
- **CI/CD**: Continuous Integration / Continuous Deployment
- **Commit**: A saved snapshot of code
- **Deployment**: Publishing code to a server
- **Environment**: Where code runs (local, staging, production)
- **Merge**: Combining changes from one branch to another
- **Migration**: Database schema change script
- **PR (Pull Request)**: Request to merge code with review
- **Production**: Live environment users access
- **Rollback**: Reverting to a previous version
- **Staging**: Testing environment before production

---

**Questions?** Create an issue or discuss with the team!

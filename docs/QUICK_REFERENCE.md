# Quick Reference Guide
## Common Development Tasks

**Last Updated**: 2026-01-21

---

## Table of Contents

- [Daily Workflows](#daily-workflows)
- [Git Commands](#git-commands)
- [Deployment Tasks](#deployment-tasks)
- [Database Tasks](#database-tasks)
- [Debugging](#debugging)
- [Emergency Procedures](#emergency-procedures)

---

## Daily Workflows

### Starting a New Feature

```bash
# 1. Get latest code
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Start development
npm run dev
# Open http://localhost:5173
```

### Making Commits

```bash
# Check what changed
git status
git diff

# Stage changes
git add .
# Or stage specific files
git add src/components/Timer.tsx

# Commit with message
git commit -m "feat: Add workout timer component"

# Push to GitHub
git push origin feature/your-feature-name
```

### Creating a Pull Request

```bash
# 1. Push your branch
git push origin feature/your-feature-name

# 2. Go to GitHub.com
# 3. Click "Compare & pull request"
# 4. Fill out description
# 5. Click "Create pull request"

# 6. Wait for Vercel to build preview
# 7. Test preview URL
# 8. Merge when ready
```

### Finishing a Feature

```bash
# After PR is merged on GitHub

# 1. Switch to main
git checkout main

# 2. Pull merged changes
git pull origin main

# 3. Delete local feature branch (optional)
git branch -d feature/your-feature-name

# 4. Start next feature!
git checkout -b feature/next-feature
```

---

## Git Commands

### Branch Management

```bash
# List all branches
git branch

# List remote branches
git branch -r

# Create new branch
git checkout -b branch-name

# Switch to existing branch
git checkout branch-name

# Delete local branch
git branch -d branch-name

# Delete local branch (force)
git branch -D branch-name

# Delete remote branch
git push origin --delete branch-name
```

### Viewing Changes

```bash
# What files changed?
git status

# What changed in files?
git diff

# What changed in staged files?
git diff --staged

# Commit history
git log

# Compact commit history
git log --oneline

# Who changed this line?
git blame filename.ts
```

### Undoing Changes

```bash
# Undo changes to a file (before staging)
git checkout -- filename.ts

# Unstage a file (after git add)
git reset HEAD filename.ts

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes) ⚠️
git reset --hard HEAD~1

# Revert a commit (creates new commit)
git revert <commit-hash>
```

### Syncing with Remote

```bash
# Pull latest from GitHub
git pull origin main

# Pull and rebase (cleaner history)
git pull --rebase origin main

# Push to GitHub
git push origin branch-name

# Force push (use carefully!) ⚠️
git push --force origin branch-name
```

### Stashing (Save Work Temporarily)

```bash
# Save current changes
git stash

# List stashes
git stash list

# Apply most recent stash
git stash pop

# Apply specific stash
git stash apply stash@{0}

# Delete stash
git stash drop
```

### Merging

```bash
# Merge another branch into current
git merge other-branch

# Abort merge if conflicts
git merge --abort

# Continue after resolving conflicts
git add .
git commit
```

---

## Deployment Tasks

### Deploying to Production

```bash
# Method 1: Via Pull Request (Recommended)
# 1. Create PR from feature branch
# 2. Test preview deployment
# 3. Merge PR on GitHub
# → Automatically deploys to production

# Method 2: Direct to main (if no branch protection)
git checkout main
git pull origin main
git merge feature/your-feature
git push origin main
# → Automatically deploys to production
```

### Checking Deployment Status

**Via Vercel Dashboard:**
1. Go to vercel.com
2. Select your project
3. Check "Deployments" tab

**Via GitHub:**
1. Go to your PR or commit
2. Check status icon (✅ or ❌)
3. Click "Details" for logs

**Via CLI:**
```bash
# Install Vercel CLI
npm i -g vercel

# Check deployment status
vercel ls
```

### Rolling Back Production

**Method 1: Vercel Dashboard**
1. Go to Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

**Method 2: Git Revert**
```bash
git checkout main
git pull origin main
git revert <bad-commit-hash>
git push origin main
# Vercel auto-deploys the revert
```

**Method 3: Hard Rollback (Emergency)**
```bash
git checkout main
git reset --hard <good-commit-hash>
git push --force origin main
# ⚠️ Use only in emergencies!
```

---

## Database Tasks

### Running Migrations Locally

```bash
# Method 1: Supabase CLI (if installed)
supabase db push

# Method 2: Supabase Dashboard
# 1. Go to supabase.com → Your Project
# 2. SQL Editor tab
# 3. Paste migration SQL
# 4. Click "Run"
```

### Creating New Migration

```bash
# Create numbered file
touch supabase/migrations/010_your_migration.sql

# Edit with your SQL
code supabase/migrations/010_your_migration.sql
```

### Backing Up Database

**Via Supabase Dashboard:**
1. Database → Backups
2. Click "Create backup"
3. Wait for completion

**Via CLI:**
```bash
# Requires Supabase CLI
supabase db dump -f backup.sql
```

### Restoring Database

**Via Supabase Dashboard:**
1. Database → Backups
2. Find backup
3. Click "Restore"
⚠️ **This overwrites current database!**

---

## Debugging

### Local Development Issues

**Server won't start:**
```bash
# Check if port 5173 is already in use
lsof -i :5173
# Kill process: kill -9 <PID>

# Or use different port
npm run dev -- --port 3000
```

**Module not found:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors:**
```bash
# Run type check
npm run type-check

# Or
npx tsc --noEmit
```

**Build fails:**
```bash
# Clean and rebuild
rm -rf dist
npm run build
```

### Production Issues

**Check browser console:**
1. Right-click → Inspect
2. Console tab
3. Look for red errors

**Check Vercel logs:**
1. Vercel Dashboard → Deployments
2. Click deployment
3. "Runtime Logs" tab

**Check Supabase logs:**
1. Supabase Dashboard → Logs
2. Filter by timeframe
3. Look for errors

### Common Errors & Fixes

**"Cannot read property of undefined":**
```typescript
// Bad
user.profile.name

// Good
user?.profile?.name
// Or
user && user.profile && user.profile.name
```

**"Module not found":**
```bash
# Install missing package
npm install <package-name>

# Update import path
# Bad:  import { foo } from './Foo'
# Good: import { foo } from './Foo.tsx'
```

**"Network request failed":**
```typescript
// Check environment variables
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)

// Verify in Vercel Dashboard:
// Settings → Environment Variables
```

---

## Emergency Procedures

### Production is Down

**Immediate Actions:**

```bash
# 1. Check Vercel status
# Visit: https://www.vercel-status.com/

# 2. Check recent deployments
# Vercel Dashboard → Deployments

# 3. Rollback to last working deployment
# Vercel Dashboard → Find working deployment → Promote to Production

# 4. Notify users (if applicable)
# Post status update on social media / status page
```

### Bad Deployment

```bash
# Quick rollback via Vercel Dashboard
# 1. Deployments → Find last good deployment
# 2. "..." → "Promote to Production"

# Or via Git
git revert HEAD
git push origin main
```

### Database Issue

```bash
# 1. STOP THE BLEEDING
# Rollback app to version before database change

# 2. ASSESS DAMAGE
# Supabase Dashboard → SQL Editor
# Run: SELECT COUNT(*) FROM affected_table;

# 3. RESTORE FROM BACKUP
# Supabase Dashboard → Database → Backups → Restore

# 4. FIX AND REDEPLOY
# Fix the migration/code
# Test locally
# Deploy fix
```

### Lost Work (Uncommitted Changes)

```bash
# If you accidentally deleted files
git checkout HEAD -- filename.ts

# If you reset too hard
git reflog  # Shows all recent commits
git checkout <commit-hash>

# If you closed terminal
# Check .git/COMMIT_EDITMSG for last commit message
```

---

## Environment Variables

### Adding a New Variable

**Locally:**
```bash
# Edit .env.local
echo "VITE_NEW_VAR=value" >> .env.local

# Restart dev server
# Ctrl+C then npm run dev
```

**Production/Preview:**
1. Vercel Dashboard → Settings → Environment Variables
2. Click "Add"
3. Name: `VITE_NEW_VAR`
4. Value: `your-value`
5. Environments: ✅ Production, ✅ Preview
6. Save
7. Redeploy: Deployments → Latest → "Redeploy"

### Accessing in Code

```typescript
// Vite automatically loads VITE_* variables
const apiUrl = import.meta.env.VITE_SUPABASE_URL
const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Type safety (in vite-env.d.ts)
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}
```

---

## Testing

### Manual Testing Checklist

```
Local (before committing):
□ Feature works as expected
□ No console errors
□ Tested on different screen sizes (mobile, tablet, desktop)
□ Existing features still work
□ npm run build succeeds

Preview (before merging):
□ Test preview URL in real browser
□ Test on actual mobile device
□ Share with teammate/friend for feedback
□ Check Vercel build logs (no warnings)

Production (after merging):
□ Visit production URL
□ Test new feature
□ Check browser console
□ Monitor for 15 minutes
```

### Automated Testing (Future)

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

---

## Performance

### Bundle Size Analysis

```bash
# Install analyzer
npm install -D rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })
  ]
})

# Build and analyze
npm run build
# Opens bundle visualization in browser
```

### Checking Load Time

```bash
# Use Chrome DevTools
# 1. Right-click → Inspect
# 2. Network tab
# 3. Reload page
# 4. Check load times

# Or use Lighthouse
# 1. Right-click → Inspect
# 2. Lighthouse tab
# 3. Click "Generate report"
```

---

## Useful Aliases (Add to ~/.bashrc or ~/.zshrc)

```bash
# Git shortcuts
alias gs='git status'
alias ga='git add'
alias gc='git commit -m'
alias gp='git push'
alias gl='git log --oneline'
alias gco='git checkout'
alias gcb='git checkout -b'
alias gm='git checkout main && git pull origin main'

# Project shortcuts
alias dev='npm run dev'
alias build='npm run build'
alias serve='npm run preview'

# Quick navigation
alias proj='cd ~/path/to/banditstracker'
```

After adding, reload:
```bash
source ~/.bashrc  # or ~/.zshrc
```

---

## Keyboard Shortcuts

### VS Code

```
Ctrl+P          → Quick file open
Ctrl+Shift+P    → Command palette
Ctrl+`          → Toggle terminal
Ctrl+B          → Toggle sidebar
Ctrl+/          → Comment line
Alt+↑/↓         → Move line up/down
Ctrl+D          → Select next occurrence
F2              → Rename symbol
Ctrl+Shift+F    → Search in files
```

### Chrome DevTools

```
F12             → Open DevTools
Ctrl+Shift+C    → Inspect element
Ctrl+Shift+M    → Toggle device toolbar (mobile view)
Ctrl+R          → Reload page
Ctrl+Shift+R    → Hard reload (clear cache)
```

---

## Useful Links

**Project Links:**
- Production: https://banditstracker.vercel.app
- GitHub Repo: https://github.com/strugcity/banditstracker
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard

**Documentation:**
- React: https://react.dev
- Vite: https://vitejs.dev
- Supabase: https://supabase.com/docs
- Vercel: https://vercel.com/docs
- TypeScript: https://www.typescriptlang.org/docs

**Tools:**
- Git Cheat Sheet: https://education.github.com/git-cheat-sheet-education.pdf
- Can I Use: https://caniuse.com
- Bundle Phobia: https://bundlephobia.com

---

## Contact & Support

**Internal:**
- Create GitHub Issue for bugs
- GitHub Discussions for questions

**External:**
- Vercel Support: https://vercel.com/help
- Supabase Discord: https://discord.supabase.com
- Stack Overflow: Tag with `vite`, `react`, `supabase`

---

**Last Updated**: 2026-01-21
**Maintained By**: Development Team

# TypeScript Types - Quick Start Guide

## 🚀 Installation

```bash
# Install dependencies
npm install

# This includes:
# - @supabase/supabase-js (for type-safe database operations)
# - vitest (for testing)
# - tsx (for running TypeScript scripts)
```

## ✅ Quick QA Check

Run this **before pushing** any type changes:

```bash
# One command to rule them all
npm run qa

# This runs:
# 1. Type checking (tsc --noEmit)
# 2. Unit tests (vitest run)
# 3. Linting (eslint)
```

## 📁 File Locations

```
src/lib/types.ts                          # ⭐ Main type definitions
src/lib/__tests__/types.test.ts           # Unit tests
src/lib/__tests__/supabase-integration.test.ts  # Integration tests
scripts/validate-types.ts                 # Schema validation script
docs/TYPE_DEFINITIONS_QA.md               # Full QA guide
docs/TYPE_USAGE_GUIDE.md                  # Usage examples
vitest.config.ts                          # Test configuration
```

## 🎯 Most Common Tasks

### 1️⃣ Using Types in Components

```typescript
import { supabase } from '@/lib/supabase';
import type { Program, CreateProgramInput } from '@/lib/types';

// Fetch data (auto-typed)
const { data } = await supabase.from('programs').select('*');

// Create data (type-safe)
const newProgram: CreateProgramInput = {
  name: 'Test Program',
  sport: 'Baseball',
  season: 'Summer 2024',
  description: null,
};
await supabase.from('programs').insert(newProgram);
```

### 2️⃣ Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test types.test.ts

# Run with UI
npm run test:ui
```

### 3️⃣ Validate Schema Sync

```bash
# Make sure types match database
npm run validate-types

# Set environment variables first
export VITE_SUPABASE_URL="your-url"
export VITE_SUPABASE_ANON_KEY="your-key"
```

### 4️⃣ Type Checking

```bash
# Check types without building
npm run type-check

# Or build (includes type checking)
npm run build
```

## 🛠️ When Schema Changes

1. **Update SQL migration** in `supabase/migrations/`
2. **Update TypeScript types** in `src/lib/types.ts`
3. **Run validation**: `npm run qa`
4. **Commit both changes together**

## 📚 Need More Info?

- **How to use types?** → See [`docs/TYPE_USAGE_GUIDE.md`](docs/TYPE_USAGE_GUIDE.md)
- **How to QA types?** → See [`docs/TYPE_DEFINITIONS_QA.md`](docs/TYPE_DEFINITIONS_QA.md)
- **Database schema?** → See [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)

## ⚡ npm Scripts Reference

```bash
npm run dev            # Start dev server
npm run build          # Build for production (includes type check)
npm run type-check     # Check types only
npm run test           # Run tests in watch mode
npm run test:run       # Run tests once
npm run test:ui        # Run tests with UI
npm run validate-types # Validate types match database schema
npm run qa             # Run all QA checks (type-check + test + lint)
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
```

## 🎓 Pro Tips

1. **Import types correctly**
   ```typescript
   import type { Program } from '@/lib/types'; // ✅ Use 'type' keyword
   ```

2. **Use helper types**
   ```typescript
   import type { Tables, TablesInsert } from '@/lib/types';
   type ProgramRow = Tables<'programs'>;
   ```

3. **Type joined queries**
   ```typescript
   import type { WorkoutWithExercises } from '@/lib/types';
   const workout = data as WorkoutWithExercises;
   ```

4. **Run QA before pushing**
   ```bash
   npm run qa  # Always pass this before pushing!
   ```

## 🚨 Common Issues

**Issue**: `Cannot find module '@/lib/types'`
- **Fix**: Check `tsconfig.json` has path alias configured

**Issue**: Types don't match database
- **Fix**: Run `npm run validate-types` to identify mismatches

**Issue**: Tests failing
- **Fix**: Make sure environment variables are set (for integration tests)

**Issue**: Type errors in IDE
- **Fix**: Restart TypeScript server (VS Code: `Cmd+Shift+P` → "Restart TS Server")

## 📞 Getting Help

1. Check the full guides in `docs/`
2. Run validation scripts to identify issues
3. Review test files for usage examples
4. Check Supabase TypeScript docs

---

**Remember**: Good types = fewer bugs = happier developers! 🎉

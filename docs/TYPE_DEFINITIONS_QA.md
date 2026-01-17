# TypeScript Type Definitions - QA & Best Practices Guide

This guide outlines comprehensive QA strategies and best practices for validating and deploying TypeScript type definitions for the Bandits Training Tracker.

## 📋 Table of Contents

1. [Quick QA Checklist](#quick-qa-checklist)
2. [Automated Testing](#automated-testing)
3. [Manual Verification](#manual-verification)
4. [Schema Synchronization](#schema-synchronization)
5. [Pre-Push Checklist](#pre-push-checklist)
6. [Best Practices](#best-practices)
7. [Common Issues](#common-issues)

---

## ✅ Quick QA Checklist

Before pushing type definitions, verify:

- [ ] All 6 database tables have corresponding interfaces
- [ ] JSONB fields are properly typed (arrays/objects, not `any`)
- [ ] Enums match database constraints exactly
- [ ] Supabase `Database` type includes all tables
- [ ] `Row`, `Insert`, `Update` types are correctly defined
- [ ] Foreign key relationships are represented
- [ ] All fields have correct TypeScript types (UUID → string, etc.)
- [ ] Optional/required fields match database schema
- [ ] JSDoc comments explain complex types
- [ ] No `any` types (unless absolutely necessary)

---

## 🤖 Automated Testing

### 1. Type Compilation Test

**Purpose**: Verify types compile without errors

```bash
# Run TypeScript compiler in type-check mode
npx tsc --noEmit

# Or with your build command
npm run build
```

**What it validates**:
- No syntax errors in type definitions
- All imports/exports resolve correctly
- Type inference works as expected

### 2. Unit Tests (Vitest)

**Purpose**: Test type structure and behavior

```bash
# Install test dependencies
npm install -D vitest @supabase/supabase-js

# Run type definition tests
npm test src/lib/__tests__/types.test.ts
```

**What it validates**:
- Interface structure matches expectations
- Enums restrict to valid values
- Helper types extract correct types
- JSONB fields accept proper structures
- Null handling works correctly

**Test file**: `src/lib/__tests__/types.test.ts`

### 3. Supabase Integration Tests

**Purpose**: Validate types work with real Supabase client

```bash
# Set environment variables
export VITE_SUPABASE_URL="your-project-url"
export VITE_SUPABASE_ANON_KEY="your-anon-key"

# Run integration tests
npm test src/lib/__tests__/supabase-integration.test.ts
```

**What it validates**:
- SELECT queries return correctly typed data
- INSERT operations accept proper input types
- UPDATE operations handle partial updates
- Joined queries match extended types
- JSONB operations work correctly
- Real-time subscriptions are typed

**Test file**: `src/lib/__tests__/supabase-integration.test.ts`

### 4. Schema Validation Script

**Purpose**: Verify types match actual database schema

```bash
# Install tsx for TypeScript execution
npm install -D tsx

# Add to package.json scripts
{
  "scripts": {
    "validate-types": "tsx scripts/validate-types.ts"
  }
}

# Run validation
npm run validate-types
```

**What it validates**:
- All tables are accessible
- JSONB structures match type definitions
- Enum values in database match TypeScript enums
- Foreign key relationships work
- No schema drift between types and database

**Script file**: `scripts/validate-types.ts`

---

## 🔍 Manual Verification

### 1. Visual Schema Comparison

**Compare types against SQL schema**:

```bash
# View database schema
cat supabase/migrations/001_initial_schema.sql

# View type definitions
cat src/lib/types.ts
```

**Checklist**:
- [ ] Each `CREATE TABLE` has a matching interface
- [ ] Column data types map correctly to TypeScript
- [ ] NOT NULL columns are required (not optional)
- [ ] DEFAULT values are reflected in Insert types
- [ ] REFERENCES (foreign keys) are documented

### 2. PostgreSQL to TypeScript Mapping

Verify these mappings are correct:

| PostgreSQL Type | TypeScript Type | Notes |
|----------------|-----------------|-------|
| UUID | `string` | UUID v4 format |
| VARCHAR(n) | `string` | Max length not enforced in TS |
| TEXT | `string` | Unlimited length |
| INTEGER | `number` | JavaScript number |
| DECIMAL(m,n) | `number` | May lose precision |
| BOOLEAN | `boolean` | true/false |
| TIMESTAMPTZ | `string` | ISO 8601 format |
| JSONB | `Type[]` or `Type` | Properly structured |

### 3. Test in IDE

**Create a test file to verify IntelliSense**:

```typescript
// test/type-check.ts
import { createClient } from '@supabase/supabase-js';
import type { Database, Program, CreateProgramInput } from '../src/lib/types';

const supabase = createClient<Database>('url', 'key');

// Test 1: Auto-completion works
const test1 = async () => {
  const { data } = await supabase.from('programs').select('*');
  // Type '.' after 'data[0].' - should show all Program fields
  if (data) console.log(data[0].name);
};

// Test 2: Insert type checking
const test2 = async () => {
  const newProgram: CreateProgramInput = {
    name: 'Test',
    // TypeScript should error if required fields are missing
  };
  await supabase.from('programs').insert(newProgram);
};

// Test 3: Joined query typing
const test3 = async () => {
  const { data } = await supabase
    .from('workouts')
    .select('*, exercises:workout_exercises(*, exercise_card:exercise_cards(*))');

  // Should have full type inference
  if (data) console.log(data[0].exercises[0].exercise_card.name);
};
```

**Expected Results**:
- ✅ IntelliSense shows all available fields
- ✅ Required fields are enforced
- ✅ Optional fields allow `undefined`
- ✅ Typos in field names cause TypeScript errors
- ✅ Joined queries infer nested types

---

## 🔄 Schema Synchronization

### Keeping Types in Sync with Database

**When schema changes occur**:

1. **Update SQL migration first**
   ```bash
   # Create new migration
   supabase migration new update_schema
   ```

2. **Update TypeScript types to match**
   - Modify interfaces in `src/lib/types.ts`
   - Update extended types if needed
   - Add new utility types

3. **Run validation**
   ```bash
   npm run validate-types
   npm test
   ```

4. **Update documentation**
   - Update JSDoc comments
   - Document breaking changes

### Using Supabase Type Generation (Alternative)

Supabase can auto-generate types from your database:

```bash
# Generate types from remote database
npx supabase gen types typescript --project-id your-project-id > src/lib/database.types.ts

# Or from local database
npx supabase gen types typescript --local > src/lib/database.types.ts
```

**Pros**:
- Always in sync with database
- Zero manual maintenance

**Cons**:
- No custom extended types
- No utility helper types
- Less readable JSDoc comments

**Best approach**: Use generated types as a base, then extend with custom types.

---

## 🚀 Pre-Push Checklist

Before pushing type definition changes:

### 1. Local Validation

```bash
# Step 1: Type check
npm run build  # or npx tsc --noEmit

# Step 2: Run tests
npm test

# Step 3: Validate schema sync
npm run validate-types

# Step 4: Lint check
npm run lint
```

### 2. Code Review Preparation

Create a clear commit message:

```bash
git add src/lib/types.ts

git commit -m "Generate complete TypeScript type definitions for database schema

- Add interfaces for all 6 database tables
- Include Supabase Database type with Row/Insert/Update helpers
- Add 6 extended types for UI components
- Map all PostgreSQL types to TypeScript correctly
- Include JSDoc comments for complex types
"
```

### 3. Documentation

Ensure these are up to date:
- [ ] README mentions type definitions location
- [ ] Examples show how to use types
- [ ] Breaking changes are documented
- [ ] Migration guide (if types changed)

### 4. PR Description Template

```markdown
## Changes

- Generated complete TypeScript type definitions for database schema
- Added types for all 6 tables: programs, workouts, exercise_cards, workout_exercises, workout_sessions, exercise_logs

## Testing

- [x] All tests pass (`npm test`)
- [x] Type checking passes (`npm run build`)
- [x] Schema validation passes (`npm run validate-types`)
- [x] Manual verification in IDE completed

## Type Safety Improvements

- Full IntelliSense support for all database operations
- Type-safe CRUD operations with Supabase client
- Properly typed JSONB fields
- Extended types for common UI patterns

## Breaking Changes

- None (new feature)

## Next Steps

- Update components to use new types
- Remove any `any` types in database queries
- Add types to existing Supabase queries
```

---

## 📚 Best Practices

### 1. Type Safety Principles

**DO**:
- ✅ Use strict TypeScript settings
- ✅ Prefer interfaces for object shapes
- ✅ Use type aliases for unions (enums)
- ✅ Make all JSONB fields properly typed
- ✅ Use helper types (`Tables<T>`, etc.)
- ✅ Add JSDoc for complex types

**DON'T**:
- ❌ Use `any` type
- ❌ Use `unknown` without type guards
- ❌ Leave JSONB as generic `object`
- ❌ Ignore TypeScript errors
- ❌ Use `@ts-ignore` without comment

### 2. Naming Conventions

- **Tables**: PascalCase singular (e.g., `Program`, not `programs`)
- **Enums**: PascalCase (e.g., `WorkoutSessionStatus`)
- **Types**: PascalCase with context (e.g., `CreateProgramInput`)
- **Database type**: `Database` (capital D)
- **Helper types**: Descriptive names (e.g., `WorkoutWithExercises`)

### 3. File Organization

```
src/lib/
├── types.ts                          # Main type definitions
├── __tests__/
│   ├── types.test.ts                # Unit tests for types
│   └── supabase-integration.test.ts # Integration tests
└── repositories/                     # Type-safe data access (future)
    ├── programs.ts
    └── workouts.ts

scripts/
└── validate-types.ts                 # Schema validation script

docs/
└── TYPE_DEFINITIONS_QA.md           # This file
```

### 4. Version Control

**Commit Strategy**:
- Atomic commits: One logical change per commit
- Clear messages: Describe what and why
- Test before commit: All checks should pass

**Branch Strategy**:
- Feature branch for new types: `feature/add-types`
- Bug fix branch: `fix/incorrect-type-mapping`
- Breaking changes: `breaking/update-types-v2`

### 5. Testing Strategy

**Test Pyramid**:
1. **Type compilation** (fastest, always run)
2. **Unit tests** (fast, run on every commit)
3. **Integration tests** (medium, run before push)
4. **Schema validation** (slow, run before PR)

### 6. Documentation

**Required Documentation**:
- JSDoc for all public types
- Usage examples for complex types
- Migration guide for breaking changes
- README section on type usage

**Example**:
```typescript
/**
 * Prescribed set structure for workout_exercises.prescribed_sets
 *
 * Defines the prescription for a single set in a workout.
 *
 * @example
 * const set: PrescribedSet = {
 *   set: 1,
 *   weight_pct: 75,
 *   reps: 5,
 *   tempo: "3010"
 * };
 */
export interface PrescribedSet {
  // ...
}
```

---

## 🐛 Common Issues

### Issue 1: "Type 'null' is not assignable to..."

**Problem**: Field is nullable in database but not in type

**Solution**:
```typescript
// Wrong
interface ExerciseCard {
  short_name: string;
}

// Correct
interface ExerciseCard {
  short_name: string | null;
}
```

### Issue 2: JSONB fields typed as `any`

**Problem**: Not properly typing JSONB columns

**Solution**:
```typescript
// Wrong
interface WorkoutExercise {
  prescribed_sets: any;
}

// Correct
interface WorkoutExercise {
  prescribed_sets: PrescribedSet[];
}
```

### Issue 3: Insert types require auto-generated fields

**Problem**: `id` and `created_at` are required in Insert type

**Solution**:
```typescript
// Wrong
Insert: Program;

// Correct
Insert: Omit<Program, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
```

### Issue 4: Joined queries don't have correct types

**Problem**: Supabase joins return `any`

**Solution**: Create extended types
```typescript
interface WorkoutWithExercises extends Workout {
  exercises: (WorkoutExercise & {
    exercise_card: ExerciseCard;
  })[];
}
```

### Issue 5: Enum values don't match database

**Problem**: Type enum has different values than database

**Solution**: Verify with schema validation script
```bash
npm run validate-types
```

---

## 🎯 Summary

**For Quick QA**:
1. Run `npm run build` (type check)
2. Run `npm test` (unit tests)
3. Run `npm run validate-types` (schema validation)
4. Visual review of types vs schema
5. Test IntelliSense in IDE

**For Pushing**:
1. Pass all QA checks above
2. Write clear commit message
3. Create PR with testing checklist
4. Request review from teammate
5. Merge only after approval and CI passes

**For Ongoing Maintenance**:
1. Update types whenever schema changes
2. Run validation after migrations
3. Keep tests up to date
4. Document breaking changes
5. Version control all type changes

---

## 📞 Getting Help

- **Type issues**: Check TypeScript compiler errors
- **Schema sync**: Run validation script
- **Supabase issues**: Check Supabase documentation
- **Test failures**: Review test output carefully

Remember: Type safety is a journey, not a destination. Start strict, stay consistent, and your codebase will thank you! 🚀

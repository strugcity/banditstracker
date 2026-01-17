# Supabase Integration Setup Guide

This guide walks you through setting up Supabase integration for the Bandits Training Tracker.

## ✅ What You've Already Done

1. ✓ Created `.env` and `.env.local` files with your Supabase credentials
2. ✓ Updated `.env.example` with the correct variable names
3. ✓ `.gitignore` already excludes `.env` files (credentials are safe)

## 🔐 Environment Variables

Your `.env` or `.env.local` file should contain:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# App Configuration (optional)
VITE_APP_NAME=Bandits Training Tracker
VITE_APP_VERSION=0.1.0
```

### Finding Your Supabase Credentials

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## 🧪 Test Your Connection

Run this command to verify everything is set up correctly:

```bash
npm run test-connection
```

This will:
- ✅ Check that environment variables are set
- ✅ Create a Supabase client
- ✅ Test access to all 6 database tables
- ✅ Provide detailed error messages if something is wrong

### Expected Output (Success)

```
🔍 Supabase Connection Test

ℹ Checking environment variables...
✓ VITE_SUPABASE_URL is set: https://xxxxx.supabase.co...
✓ VITE_SUPABASE_ANON_KEY is set

ℹ Creating Supabase client...
✓ Supabase client created successfully

ℹ Testing database connection...

📊 Test Results

✓ programs table accessible
✓ workouts table accessible
✓ exercise_cards table accessible
✓ workout_exercises table accessible
✓ workout_sessions table accessible
✓ exercise_logs table accessible

📈 Summary

Total Tests: 6
Passed: 6
Failed: 0

🎉 All tests passed! Your Supabase connection is working correctly.
```

## 🚀 Using Supabase in Your Code

### Import the Pre-configured Client

```typescript
import { supabase } from '@/lib/supabase';
import type { Program, CreateProgramInput } from '@/lib/types';

// The client is already typed with your Database schema!
```

### Example: Fetch Data

```typescript
async function getPrograms() {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching programs:', error);
    return [];
  }

  // data is automatically typed as Program[]
  return data;
}
```

### Example: Insert Data

```typescript
async function createProgram(name: string, sport: string) {
  const newProgram: CreateProgramInput = {
    name,
    sport,
    season: 'Summer 2024',
    description: null,
  };

  const { data, error } = await supabase
    .from('programs')
    .insert(newProgram)
    .select()
    .single();

  if (error) {
    console.error('Error creating program:', error);
    return null;
  }

  // data is automatically typed as Program
  return data;
}
```

### Example: Update Data

```typescript
async function updateProgram(id: string, name: string) {
  const { data, error } = await supabase
    .from('programs')
    .update({ name })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating program:', error);
    return null;
  }

  return data;
}
```

### Example: Delete Data

```typescript
async function deleteProgram(id: string) {
  const { error } = await supabase
    .from('programs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting program:', error);
    return false;
  }

  return true;
}
```

### Example: Joined Queries

```typescript
import type { WorkoutWithExercises } from '@/lib/types';

async function getWorkoutWithExercises(workoutId: string) {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      *,
      exercises:workout_exercises(
        *,
        exercise_card:exercise_cards(*)
      )
    `)
    .eq('id', workoutId)
    .single();

  if (error) {
    console.error('Error fetching workout:', error);
    return null;
  }

  // Cast to extended type for full typing
  return data as WorkoutWithExercises;
}
```

## 🧩 Using in React Components

### Example: Program List Component

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Program } from '@/lib/types';

export function ProgramList() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const { data, error } = await supabase
          .from('programs')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setPrograms(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchPrograms();
  }, []);

  if (loading) return <div>Loading programs...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Training Programs</h1>
      {programs.map((program) => (
        <div key={program.id}>
          <h2>{program.name}</h2>
          <p>{program.sport} - {program.season}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example: With React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Program } from '@/lib/types';

export function ProgramList() {
  const { data: programs, isLoading, error } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Program[];
    },
  });

  if (isLoading) return <div>Loading programs...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Training Programs</h1>
      {programs?.map((program) => (
        <div key={program.id}>
          <h2>{program.name}</h2>
          <p>{program.sport} - {program.season}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🔄 Running Integration Tests

Now that your credentials are set up, you can run the full integration test suite:

```bash
npm test
```

This will run **all tests** including:
- ✅ 15 unit tests (type definitions)
- ✅ 12 integration tests (Supabase operations)

Before, the integration tests were skipped. Now they will actually run!

### Run Only Integration Tests

```bash
npm test supabase-integration
```

## 🔒 Security Best Practices

### ✅ What's Already Secure

1. **Environment files are gitignored** - Your credentials won't be committed
2. **Using anon key** - Public key with RLS protection
3. **`.env.example` has placeholders** - No real credentials in repository

### ⚠️ Important Security Notes

1. **Never commit `.env` or `.env.local`**
   - Already in `.gitignore` ✓
   - Double-check before pushing

2. **Use Row Level Security (RLS)**
   - Enable RLS on all tables in Supabase
   - Create policies for access control
   - The anon key respects RLS policies

3. **Anon Key vs Service Key**
   - `VITE_SUPABASE_ANON_KEY` - Safe to use in frontend (respects RLS)
   - `SUPABASE_SERVICE_KEY` - **NEVER** use in frontend (bypasses RLS)

4. **GitHub Secrets for CI/CD**
   - If using GitHub Actions, add credentials as secrets
   - Never hardcode in workflow files

## 🛠️ Troubleshooting

### Issue: "Missing VITE_SUPABASE_URL environment variable"

**Solution**: Make sure you have a `.env` or `.env.local` file in your project root with the correct variables.

```bash
# Check if file exists
ls -la .env*

# If missing, create it
cp .env.example .env
# Then add your real credentials
```

### Issue: "Failed to fetch" or connection errors

**Solutions**:
1. Verify your Supabase project is active in the dashboard
2. Check that your URL and key are correct
3. Ensure your internet connection is working
4. Try the test script: `npm run test-connection`

### Issue: "permission denied for table X"

**Solutions**:
1. Enable Row Level Security (RLS) in Supabase
2. Create RLS policies to allow access
3. For development, you can temporarily disable RLS (not recommended for production)

### Issue: Integration tests still skipped

**Solutions**:
1. Restart your dev server after adding `.env` file
2. Make sure variable names match exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Check that `.env` file is in the project root (not in `src/`)

### Issue: Types don't match database

**Solution**: Run the schema validation script:

```bash
npm run validate-types
```

This will check if your TypeScript types match your actual database schema.

## 📋 Checklist

Before you start development, verify:

- [ ] `.env` or `.env.local` file exists with correct credentials
- [ ] `npm run test-connection` passes all tests
- [ ] `npm test` runs all integration tests successfully
- [ ] RLS is enabled on Supabase tables (for production)
- [ ] RLS policies are configured (for production)
- [ ] `.env` files are in `.gitignore`

## 🎯 Next Steps

1. **Test the connection**: Run `npm run test-connection`
2. **Run integration tests**: Run `npm test`
3. **Start development**: Run `npm run dev`
4. **Build your app**: Import `supabase` from `@/lib/supabase` in your components

## 📚 Additional Resources

- [Supabase TypeScript Docs](https://supabase.com/docs/reference/javascript/typescript-support)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript/introduction)
- [Type Definitions Guide](./TYPE_USAGE_GUIDE.md) - Our custom types documentation

---

**You're all set!** 🚀 Your Supabase integration is ready to use.

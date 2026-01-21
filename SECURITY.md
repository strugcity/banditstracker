# Security Architecture - Bandits Training Tracker

## Overview

This application uses a **defense-in-depth** security model with multiple layers of protection:

1. **Database Level**: Row Level Security (RLS) policies in Supabase
2. **Application Level**: Query validation and explicit filtering
3. **UI Level**: Client-side route guards (UX only, not security)

## 🔒 Primary Security: Row Level Security (RLS)

### What is RLS?

Row Level Security is a **database-level** security feature that enforces access control policies at the PostgreSQL level. RLS policies are evaluated **server-side** and cannot be bypassed by client-side code manipulation.

### Our RLS Implementation

All tables with user data have RLS enabled:

- ✅ `profiles` - Users can read their own profile, admins can read all
- ✅ `workout_sessions` - Users can only access their own sessions
- ✅ `exercise_logs` - Users can only access logs from their own sessions
- ✅ `teams` - Users can only access teams they belong to
- ✅ `team_members` - Users can only see members of their teams

**Location**: `supabase/migrations/005_add_auth_system_fixed.sql` and later migrations

### Key RLS Policies

#### Workout Sessions
```sql
-- Users can only create sessions for themselves
CREATE POLICY "workout_sessions_insert" ON workout_sessions
    FOR INSERT WITH CHECK (athlete_id = auth.uid());

-- Users can only view their own sessions
CREATE POLICY "workout_sessions_select" ON workout_sessions
    FOR SELECT USING (athlete_id = auth.uid());
```

#### Exercise Logs
```sql
-- Users can only view logs from their own sessions
CREATE POLICY "exercise_logs_select" ON exercise_logs
    FOR SELECT USING (
        workout_session_id IN (
            SELECT id FROM workout_sessions WHERE athlete_id = auth.uid()
        )
    );
```

## 🛡️ Application-Level Security

### Required Parameters

All query functions that fetch user data **require** explicit user IDs:

**Before (vulnerable pattern):**
```typescript
// ❌ Optional athleteId could expose all users' data
export async function getWorkoutHistory(athleteId?: string) {
  let query = supabase.from('workout_sessions').select('*')
  if (athleteId) {
    query = query.eq('athlete_id', athleteId)  // Easy to forget!
  }
  return query
}
```

**After (secure pattern):**
```typescript
// ✅ athleteId is required - explicit filtering enforced
export async function getWorkoutHistory(athleteId: string) {
  if (!athleteId) {
    throw new Error('athleteId is required')
  }
  return supabase
    .from('workout_sessions')
    .select('*')
    .eq('athlete_id', athleteId)  // Always filtered
}
```

**Why both?** Defense in depth. Even though RLS prevents data leaks, explicit filtering:
- Makes code intention clear
- Prevents developer mistakes
- Reduces database query load
- Provides faster error feedback

### Validated Functions

The following functions enforce explicit filtering:

- `createWorkoutSession(workoutId, athleteId)` - athleteId REQUIRED
- `getWorkoutHistory(athleteId, limit)` - athleteId REQUIRED
- `getPreviousSessionLogs(workoutId, athleteId)` - athleteId REQUIRED

## 🎨 UI-Level Protection (UX Only)

### Client-Side Guards

Components like `RoleGuard` and `ProtectedRoute` provide **user experience** protection only:

```typescript
// ⚠️ This is UX, not security!
<RoleGuard requiredRole="team_admin">
  <TeamManagement />
</RoleGuard>
```

**Why they exist:**
- Prevent user confusion (hiding unavailable features)
- Improve UX (redirect instead of error messages)
- Reduce unnecessary API calls

**Why they're not security:**
- React state can be modified in browser DevTools
- Routes can be navigated to directly
- Supabase client can be called from browser console

**The safety net:** RLS policies will reject unauthorized queries regardless of UI bypass.

## 🧪 Testing Security

### RLS Penetration Test

**Test Case: User A attempts to access User B's data**

```javascript
// In browser console as User A:
const { data, error } = await supabase
  .from('workout_sessions')
  .select('*')
  .eq('athlete_id', 'user-b-uuid')  // Different user!

// Expected: error or empty array
// Actual: RLS blocks the query
console.log(data)  // []
```

### Recommended Test Suite

Create `tests/security/rls.test.ts`:

```typescript
describe('RLS Policies', () => {
  it('prevents User A from viewing User B workout sessions', async () => {
    const userA = await createTestUser()
    const userB = await createTestUser()

    const sessionB = await createWorkoutSession(userB.id, 'workout-1')

    // Log in as User A
    await supabase.auth.signInWithPassword(userA.email, userA.password)

    // Attempt to fetch User B's session
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('id', sessionB.id)

    expect(data).toHaveLength(0)  // RLS blocks access
  })
})
```

## 🚨 Common Security Mistakes to Avoid

### ❌ DON'T: Trust client-side checks
```typescript
// Bad: Checking permissions on client only
if (user.role === 'admin') {
  await supabase.from('users').delete().eq('id', targetUserId)
}
```

### ✅ DO: Rely on RLS policies
```typescript
// Good: Let RLS enforce permissions
await supabase.from('users').delete().eq('id', targetUserId)
// RLS policy will reject if user is not admin
```

### ❌ DON'T: Use optional filtering parameters
```typescript
// Bad: Easy to forget the filter
async function getData(userId?: string) {
  let query = supabase.from('data').select('*')
  if (userId) query = query.eq('user_id', userId)
  return query
}
```

### ✅ DO: Require filtering parameters
```typescript
// Good: Filtering always applied
async function getData(userId: string) {
  if (!userId) throw new Error('userId required')
  return supabase.from('data').select('*').eq('user_id', userId)
}
```

### ❌ DON'T: Allow null foreign keys in multi-tenant tables
```typescript
// Bad: Creates orphaned data
athlete_id: athleteId || null  // null = no owner!
```

### ✅ DO: Enforce foreign key requirements
```typescript
// Good: All data has an owner
if (!athleteId) throw new Error('athleteId required')
athlete_id: athleteId  // Always set
```

## 📋 Security Checklist for New Features

When adding a new feature:

- [ ] Create RLS policies for new tables (`supabase/migrations/`)
- [ ] Test RLS policies with multiple users
- [ ] Require user IDs in all query functions (no optional `userId?`)
- [ ] Add NOT NULL constraints for foreign keys to users
- [ ] Document which fields are security-critical in code comments
- [ ] Add client-side guards for UX (but don't rely on them for security)
- [ ] Write penetration tests attempting to bypass RLS

## 🔍 Migration Review Process

Before applying any migration:

1. **Check RLS**: Does the migration enable RLS on new tables?
2. **Check Policies**: Are there policies for SELECT, INSERT, UPDATE, DELETE?
3. **Check Foreign Keys**: Are user_id/athlete_id columns NOT NULL?
4. **Test Manually**: Can User A access User B's data?

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Migration files: `supabase/migrations/`
- Query functions: `src/lib/queries.ts`

---

**Last Updated**: 2026-01-21
**Reviewed By**: Claude (QA Security Audit Response)

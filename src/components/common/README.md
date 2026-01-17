# Common UI Components

A library of reusable UI components for the Bandits Training Tracker, built with React, TypeScript, and TailwindCSS following mobile-first design principles.

## Features

- **Mobile-First**: All components optimized for touch interfaces with minimum 44x44px tap targets
- **Accessible**: WCAG AA compliant with proper ARIA labels and keyboard navigation
- **TypeScript**: Fully typed with comprehensive interfaces
- **Consistent Design**: Uses Bandits brand colors and consistent spacing
- **Touch-Friendly**: Proper active states and spacing for mobile devices
- **iOS Optimized**: 16px minimum font size prevents unwanted zoom on iOS

## Installation

The components use the following dependencies:

```bash
npm install clsx tailwind-merge
```

## Design System

### Colors

- **Primary**: Blue (bg-blue-600, text-blue-600, border-blue-600)
- **Secondary**: Red (bg-red-600, text-red-600, border-red-600)
- **Success**: Green (bg-green-600)
- **Warning**: Yellow (bg-yellow-500)
- **Danger**: Red (bg-red-600)
- **Gray Scale**: gray-50 to gray-900

### Spacing

Uses Tailwind spacing scale: 1, 2, 3, 4, 6, 8, 12, 16

### Typography

- **Font Sizes**: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl
- **Font Weights**: font-normal, font-medium, font-semibold, font-bold

### Borders

- **Radius**: rounded (4px), rounded-lg (8px), rounded-full
- **Width**: border (1px), border-2 (2px)

## Components

### Button

A flexible button component with multiple variants, sizes, and states.

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `fullWidth`: boolean (default: false)
- `loading`: boolean (default: false)
- `leftIcon`: React.ReactNode
- `rightIcon`: React.ReactNode

**Usage:**

```tsx
import { Button } from '@/components/common'

// Basic primary button
<Button variant="primary">Click me</Button>

// Button with loading state
<Button loading>Saving...</Button>

// Button with icon
<Button leftIcon={<PlusIcon />}>Add Workout</Button>

// Full width button
<Button fullWidth variant="secondary">Submit</Button>

// Outline button with right icon
<Button variant="outline" rightIcon={<ArrowIcon />}>Next</Button>
```

### Input

A flexible input component with label, error states, and icon support.

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `leftIcon`: React.ReactNode
- `rightIcon`: React.ReactNode
- All standard HTML input props

**Usage:**

```tsx
import { Input } from '@/components/common'

// Basic input with label
<Input label="Email" type="email" placeholder="Enter your email" />

// Input with error state
<Input
  label="Username"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  error="Username is required"
/>

// Input with helper text
<Input
  label="Password"
  type="password"
  helperText="Must be at least 8 characters"
/>

// Number input with left icon (shows numeric keyboard on mobile)
<Input
  label="Reps"
  type="number"
  inputMode="numeric"
  leftIcon={<HashIcon />}
/>
```

### Card

A flexible card container with multiple variants and padding options.

**Props:**
- `variant`: 'default' | 'elevated' | 'outlined' (default: 'default')
- `padding`: 'none' | 'sm' | 'md' | 'lg' (default: 'md')
- `clickable`: boolean (default: false)
- All standard HTML div props

**Usage:**

```tsx
import { Card } from '@/components/common'

// Basic card
<Card>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>

// Elevated card with large padding
<Card variant="elevated" padding="lg">
  <h2>Workout Summary</h2>
  <p>Details...</p>
</Card>

// Clickable card
<Card clickable onClick={() => navigate('/workout/123')}>
  <h3>Push Day</h3>
  <p>Click to view details</p>
</Card>

// Outlined card with no padding (custom layout)
<Card variant="outlined" padding="none">
  <div className="p-4 border-b">Header</div>
  <div className="p-4">Content</div>
</Card>
```

### Select

A native select dropdown with label and error states.

**Props:**
- `label`: string
- `error`: string
- `options`: Array<{ value: string | number; label: string }>
- `placeholder`: string
- All standard HTML select props

**Usage:**

```tsx
import { Select } from '@/components/common'

// Basic select
<Select
  label="Exercise Type"
  options={[
    { value: 'push', label: 'Push' },
    { value: 'pull', label: 'Pull' },
    { value: 'legs', label: 'Legs' },
  ]}
/>

// Select with placeholder and controlled value
<Select
  label="Workout Day"
  placeholder="Select a day..."
  value={selectedDay}
  onChange={(e) => setSelectedDay(e.target.value)}
  options={dayOptions}
/>

// Select with error
<Select
  label="Exercise"
  options={exercises}
  error="Please select an exercise"
/>
```

### Badge

A versatile badge component for labels, status indicators, and counts.

**Props:**
- `variant`: 'default' | 'success' | 'warning' | 'danger' | 'info' (default: 'default')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `dot`: boolean (default: false)
- `icon`: React.ReactNode

**Usage:**

```tsx
import { Badge } from '@/components/common'

// Default badge
<Badge>New</Badge>

// Success badge
<Badge variant="success">Completed</Badge>

// Badge with dot indicator
<Badge variant="warning" dot>In Progress</Badge>

// Badge with icon
<Badge variant="info" icon={<InfoIcon />}>Important</Badge>

// Small danger badge
<Badge variant="danger" size="sm">Error</Badge>
```

### Spinner

A loading spinner component with multiple sizes and colors.

**Props:**
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `color`: 'current' | 'primary' | 'white' (default: 'primary')
- `aria-label`: string (default: 'Loading')

**Usage:**

```tsx
import { Spinner } from '@/components/common'

// Default spinner
<Spinner />

// Small spinner with current color
<Spinner size="sm" color="current" />

// Large white spinner with custom label
<Spinner size="lg" color="white" aria-label="Loading workouts..." />

// Inline with text
<div className="flex items-center gap-2">
  <Spinner size="sm" />
  <span>Loading...</span>
</div>
```

### EmptyState

A component to display when there's no content or data to show.

**Props:**
- `icon`: React.ReactNode
- `title`: string (required)
- `message`: string (required)
- `action`: { label: string; onClick: () => void }
- `className`: string

**Usage:**

```tsx
import { EmptyState } from '@/components/common'

// Basic empty state
<EmptyState
  title="No workouts yet"
  message="Start tracking your training by adding your first workout."
/>

// Empty state with icon
<EmptyState
  icon={<WorkoutIcon className="h-16 w-16 text-gray-400" />}
  title="No exercises found"
  message="Try adjusting your search or filters."
/>

// Empty state with action button
<EmptyState
  icon={<PlusIcon className="h-16 w-16 text-gray-400" />}
  title="No training sessions"
  message="Create your first training session to get started."
  action={{
    label: 'Add Session',
    onClick: () => navigate('/sessions/new')
  }}
/>
```

## Importing Components

You can import components individually or all at once:

```tsx
// Individual imports
import { Button } from '@/components/common'
import { Input } from '@/components/common'

// Multiple imports
import { Button, Input, Card, Badge } from '@/components/common'

// With types
import { Button, type ButtonProps } from '@/components/common'
```

## Accessibility Features

All components include:

- Proper ARIA labels and roles
- Keyboard navigation support
- Focus visible states
- Screen reader friendly markup
- Color contrast meeting WCAG AA standards
- Disabled state handling

## Mobile Optimizations

- **Tap Targets**: All interactive elements meet 44x44px minimum
- **Font Sizes**: 16px minimum to prevent iOS zoom
- **Touch Feedback**: Active states provide visual feedback
- **Native Controls**: Select uses native dropdown for better mobile UX
- **Responsive Spacing**: Touch-friendly gaps and padding

## Examples

### Form Example

```tsx
import { Input, Select, Button, Card } from '@/components/common'

function WorkoutForm() {
  return (
    <Card>
      <form className="space-y-4">
        <Input
          label="Workout Name"
          placeholder="Enter workout name"
          required
        />

        <Select
          label="Exercise Type"
          options={[
            { value: 'push', label: 'Push' },
            { value: 'pull', label: 'Pull' },
            { value: 'legs', label: 'Legs' },
          ]}
          required
        />

        <Input
          label="Reps"
          type="number"
          inputMode="numeric"
          placeholder="0"
        />

        <Button type="submit" fullWidth>
          Save Workout
        </Button>
      </form>
    </Card>
  )
}
```

### List with Empty State

```tsx
import { Card, Badge, EmptyState } from '@/components/common'

function WorkoutList({ workouts }) {
  if (workouts.length === 0) {
    return (
      <EmptyState
        title="No workouts yet"
        message="Start tracking your training by adding your first workout."
        action={{
          label: 'Add Workout',
          onClick: () => navigate('/workouts/new')
        }}
      />
    )
  }

  return (
    <div className="space-y-3">
      {workouts.map(workout => (
        <Card key={workout.id} clickable>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{workout.name}</h3>
            <Badge variant="success">Completed</Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {workout.exercises.length} exercises
          </p>
        </Card>
      ))}
    </div>
  )
}
```

### Loading State

```tsx
import { Button, Spinner, Card } from '@/components/common'

function SaveButton({ onSave, isSaving }) {
  return (
    <Button
      onClick={onSave}
      loading={isSaving}
      disabled={isSaving}
      fullWidth
    >
      {isSaving ? 'Saving...' : 'Save Workout'}
    </Button>
  )
}

function LoadingCard() {
  return (
    <Card className="flex items-center justify-center py-12">
      <Spinner size="lg" />
    </Card>
  )
}
```

## Best Practices

1. **Use semantic HTML**: Components render appropriate HTML elements
2. **Provide labels**: Always include labels for form inputs for accessibility
3. **Handle errors**: Display error messages for better UX
4. **Loading states**: Show loading indicators for async operations
5. **Empty states**: Provide guidance when no data is available
6. **Touch targets**: Don't override minimum tap target sizes
7. **Form validation**: Combine with form libraries for robust validation
8. **Responsive design**: Use Tailwind responsive prefixes when needed

## Contributing

When adding new components:

1. Follow mobile-first principles
2. Ensure accessibility (ARIA, keyboard nav, focus states)
3. Use TypeScript with proper types
4. Add JSDoc comments
5. Include usage examples
6. Test on mobile devices
7. Maintain consistent design system

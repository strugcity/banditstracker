# Architecture Documentation

## Overview

Bandits Training Tracker is a mobile-first workout tracking application built with React 18, TypeScript, and Supabase.

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query)
- **Backend**: Supabase (PostgreSQL database + Auth + Storage)
- **Deployment**: TBD (Vercel/Netlify recommended)

## Application Structure

```
src/
├── components/      # Reusable React components
├── pages/          # Route-level page components
├── hooks/          # Custom React hooks
├── lib/            # Core utilities and services
├── utils/          # Helper functions
├── constants/      # App constants
└── assets/         # Static assets
```

## Data Flow

1. **User Interaction** → Component
2. **Component** → React Query hook
3. **React Query** → Supabase query function (in `lib/queries.ts`)
4. **Supabase** → PostgreSQL database
5. **Response** → React Query cache → Component update

## Key Architectural Decisions

### Mobile-First Design
- All components designed for mobile screens first
- Touch-optimized UI (44x44px minimum touch targets)
- iOS zoom prevention (16px minimum font size on inputs)

### Offline-First (Future)
- React Query caching for offline data access
- Service Worker for PWA capabilities
- Local-first data with background sync

### Type Safety
- Strict TypeScript configuration
- Database types generated from Supabase schema
- All API responses typed

## Security Considerations

- Row Level Security (RLS) enabled on all Supabase tables
- Authentication via Supabase Auth
- Environment variables for sensitive data
- No sensitive data in client-side code

## Performance Optimizations

- Code splitting by route
- Lazy loading of components
- React Query for efficient data fetching
- Optimized bundle size (<200kb gzipped target)

## Future Enhancements

- PWA capabilities (offline mode, install prompt)
- Video service integration for exercise cards
- Real-time updates via Supabase Realtime
- Analytics integration

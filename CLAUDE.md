# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Tech Stack

- **Framework**: Next.js 16.1 with App Router
- **Language**: TypeScript with strict mode
- **UI**: React 19, Tailwind CSS 4, Lucide icons
- **Backend**: Supabase (auth, database, real-time subscriptions)
- **Tables**: @tanstack/react-table with virtualization (@tanstack/react-virtual)
- **3D/Graphics**: Three.js with React Three Fiber (landing page only)

## Architecture Overview

### Authentication & Authorization Flow

1. **Middleware** (`middleware.ts`): Server-side route protection using Supabase SSR client. Redirects unauthenticated users from protected routes (`/workspace`, `/progress`, `/settings`) to `/login`.

2. **AuthProvider** (`lib/auth/auth-context.tsx`): Client-side context providing user, session, profile, and organization state. Manages multi-organization switching with localStorage persistence (`taskos_current_org`).

3. **useRequireOrg hook** (`lib/auth/hooks.ts`): Ensures user has an organization before accessing dashboard routes, redirects to `/onboarding` if none exists.

### Route Structure (App Router)

- `/` - Landing page (public)
- `/(auth)/login`, `/(auth)/signup` - Authentication pages
- `/onboarding` - Organization creation/joining flow
- `/(dashboard)/*` - Protected dashboard routes with sidebar layout
  - `/workspace` - Main task and calendar view
  - `/progress` - Progress tracking
  - `/settings` - User and organization settings

### Data Layer Pattern

All data hooks follow the same pattern (`lib/hooks/use-*.ts`):
- Fetch data scoped to current user and organization
- Set up Supabase real-time subscriptions for live updates
- Provide CRUD operations with optimistic updates
- Transform snake_case DB columns to camelCase frontend types

Key hooks:
- `useTasks()` - Task CRUD with multi-owner support via junction table
- `useCalendarBlocks()` - Calendar time block scheduling
- `useMultiMemberBlocks()` - View multiple members' schedules
- `useOrganization()`, `useOrganizationMembers()` - Organization data

### Type System

- `lib/database.types.ts` - Auto-generated Supabase types (regenerate with `npx supabase gen types`)
- `lib/types.ts` - Frontend types derived from database types, with snake_case to camelCase mapping

### Component Architecture

**EditableTable** (`components/editable-table/`):
Reusable data table with inline editing, drag-and-drop rows, and column management. Cell types: text, number, select, people, timerNumber.

**Calendar** (`components/calendar/`):
Week/day view calendar for scheduling tasks. Supports drag-to-create blocks, multi-member viewing, and weekend toggle.

**Landing Page** (`components/landing/`):
Marketing pages with Three.js effects and reveal animations.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Path Aliases

Use `@/*` for imports from the project root (configured in tsconfig.json).

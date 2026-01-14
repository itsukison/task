# Daily Execution OS — Design Roadmap

## Overview

A phased approach to building the task execution platform for Japanese startups, prioritizing core functionality before polish.

---

## Phase Summary

| Phase | Focus | Duration | Deliverable |
|-------|-------|----------|-------------|
| **Phase 1** | Foundation & Auth | 1 week | Login, org setup, basic layout |
| **Phase 2** | Task Management | 1.5 weeks | Task CRUD, table view, timer |
| **Phase 3** | Calendar Integration | 1.5 weeks | Week view, drag-drop, sync |
| **Phase 4** | Leader Dashboard | 1 week | Progress tracking, visibility |
| **Phase 5** | Polish & Settings | 1 week | Preferences, UI state, final QA |

**Total Estimated: 6 weeks**

---

## Phase 1: Foundation & Auth

**Goal**: Secure authentication and organizational structure.

### Deliverables
- [ ] Supabase project setup with database schema
- [ ] NextAuth or Supabase Auth integration
- [ ] Organization creation/join flow
- [ ] Global layout with hamburger sidebar
- [ ] Role assignment (leader/employee)

### Key Database Tables
- `organizations`
- `organization_members`
- `user_profiles`

### Success Criteria
- User can sign up → create/join org → see empty dashboard
- RLS policies verified working

**Detailed spec**: [Phase 1 Detail](./phase1_foundation.md)

---

## Phase 2: Task Management

**Goal**: Full task CRUD with time tracking.

### Deliverables
- [ ] Task table view (left panel)
- [ ] Inline editing for expected time
- [ ] Task detail modal (Notion-style)
- [ ] Timer start/pause functionality
- [ ] Task status management
- [ ] Visibility controls per task

### Key Database Tables
- `tasks`
- `time_logs`

### Success Criteria
- User can create task → set expected time → start timer → complete task
- Actual time accurately reflects logged time

**Detailed spec**: [Phase 2 Detail](./phase2_tasks.md)

---

## Phase 3: Calendar Integration

**Goal**: Visual time-block scheduling with drag-drop.

### Deliverables
- [ ] Week-based calendar view (right panel)
- [ ] Draggable divider between task/calendar
- [ ] Drag task → calendar placement
- [ ] Block height = expected time
- [ ] Color states (planned/in-progress/overrun/completed)
- [ ] Resize blocks to adjust time
- [ ] Overlap filter for team schedules

### Key Database Tables
- `calendar_blocks`

### Success Criteria
- Task dragged to calendar creates block
- Resizing block updates expected time bidirectionally
- No visual double-booking (EXCLUDE constraint)

**Detailed spec**: [Phase 3 Detail](./phase3_calendar.md)

---

## Phase 4: Leader Dashboard

**Goal**: Team workload visibility for managers.

### Deliverables
- [ ] Progress Tracking page (leader-only)
- [ ] Team member table with metrics
- [ ] Speed indicator (actual vs expected)
- [ ] Click-to-expand employee modal
- [ ] Mini calendar preview (optional)

### Key Database Queries
- Aggregate `tasks` by employee
- Calculate actual/expected ratios
- Filter by visibility rules

### Success Criteria
- Leader can see all team tasks respecting visibility
- Employee cannot access Progress Tracking page

**Detailed spec**: [Phase 4 Detail](./phase4_leader.md)

---

## Phase 5: Polish & Settings

**Goal**: Persistence, preferences, and production readiness.

### Deliverables
- [ ] Settings page (work hours, granularity)
- [ ] UI state persistence (split ratio, collapsed states)
- [ ] Responsive layout tweaks
- [ ] Error handling & loading states
- [ ] Audit log viewer for leaders
- [ ] Final security review

### Key Database Tables
- `user_preferences`
- `audit_logs`

### Success Criteria
- User closes browser → reopens → same UI state
- All edge cases handled gracefully

**Detailed spec**: [Phase 5 Detail](./phase5_settings.md)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) |
| UI Components | shadcn/ui (https://ui.shadcn.com) |
| Styling | Tailwind CSS v4 |
| State | Zustand or React Context |
| Backend | Supabase (Postgres + Auth + Realtime) |
| Drag-Drop | @dnd-kit/core |
| Calendar | Custom or react-big-calendar |
| Deployment | Vercel |

**IMPORTANT**: Use shadcn/ui components for all UI elements:
- Buttons: `<Button>` from `@/components/ui/button`
- Inputs: `<Input>` from `@/components/ui/input`
- Labels: `<Label>` from `@/components/ui/label`
- Install additional components as needed: `npx shadcn@latest add [component]`

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Calendar drag-drop complexity | Use battle-tested @dnd-kit library |
| Real-time sync issues | Supabase Realtime subscriptions |
| RLS performance | Proper indexing, helper function caching |
| Timezone confusion | All times stored as TIMESTAMPTZ, display in JST |

---

## Out of Scope (V1)

Per PRD:
- Kanban boards
- OKRs
- Chat
- Analytics dashboards
- Gamification
- Monthly views

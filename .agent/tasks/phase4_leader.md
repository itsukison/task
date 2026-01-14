# Phase 4: Leader Dashboard

## Overview

Build the Progress Tracking page for leaders to monitor team workload and execution speed with clean data visualization following the design system.

---

## Access Control

```typescript
// middleware.ts or layout check
if (pathname === '/progress' && role !== 'leader') {
  redirect('/dashboard');
}
```

---

## Page Design Specifications

### Progress Table Container

```css
.progress-container {
  padding: 32px 48px
  max-width: 1400px
  margin: 0 auto
}

.progress-header {
  display: flex
  justify-content: space-between
  align-items: center
  margin-bottom: 32px

  h1 {
    font-size: var(--font-size-3xl)
    font-weight: var(--font-weight-semibold)
    color: var(--text-primary)
  }
}

.filter-group {
  display: flex
  gap: 12px
}
```

---

## Progress Table Design

**Table Structure** (Same styling as task table, with additions):

```css
.progress-table {
  background: var(--bg-primary)
  border: 1px solid var(--border-primary)
  border-radius: var(--radius-md)
  overflow: hidden
}

/* Header cells with sorting */
.table-header-sortable {
  cursor: pointer
  user-select: none

  &:hover {
    color: var(--text-primary)
  }

  svg {
    display: inline-block
    width: 14px
    height: 14px
    margin-left: 4px
    color: var(--text-tertiary)
  }
}

/* Employee cell with avatar */
.employee-cell {
  display: flex
  align-items: center
  gap: 12px

  .avatar {
    width: 32px
    height: 32px
    border-radius: var(--radius-full)
    background: var(--orange-100)
    color: var(--orange-700)
    display: flex
    align-items: center
    justify-content: center
    font-size: 14px
    font-weight: var(--font-weight-semibold)
  }

  .name {
    font-weight: var(--font-weight-medium)
    color: var(--text-primary)
  }
}

/* Numeric columns */
.numeric-cell {
  font-family: var(--font-family-mono)
  text-align: right
  color: var(--text-secondary)
}
```

---

## Speed Indicator Design

```css
.speed-indicator {
  display: flex
  align-items: center
  gap: 12px
  min-width: 200px
}

.speed-bar-container {
  flex: 1
  height: 8px
  background: var(--bg-tertiary)
  border-radius: var(--radius-full)
  overflow: hidden
  position: relative
}

.speed-bar-fill {
  height: 100%
  border-radius: var(--radius-full)
  transition: width 300ms ease-out, background-color 200ms ease-out
}

/* Speed status colors */
.speed-ahead {
  background: var(--success-solid)
}

.speed-on-track {
  background: var(--info-solid)
}

.speed-behind {
  background: var(--warning-solid)
}

.speed-overrun {
  background: var(--error-solid)
}

/* Speed percentage */
.speed-percentage {
  font-family: var(--font-family-mono)
  font-size: 13px
  font-weight: var(--font-weight-semibold)
  min-width: 50px
  text-align: right
}

/* Speed icon */
.speed-icon {
  width: 16px
  height: 16px
}

.speed-icon.ahead {
  color: var(--success-solid)
}

.speed-icon.on-track {
  color: var(--info-solid)
}

.speed-icon.behind {
  color: var(--warning-solid)
}

.speed-icon.overrun {
  color: var(--error-solid)
}
```

---

## Employee Detail Modal Design

```css
.employee-modal {
  max-width: 800px
  width: 90%
}

/* Modal header with summary */
.employee-modal-header {
  padding: 24px 32px
  border-bottom: 1px solid var(--border-primary)

  h2 {
    font-size: var(--font-size-2xl)
    font-weight: var(--font-weight-semibold)
    color: var(--text-primary)
    margin-bottom: 8px
  }

  .date-subtitle {
    font-size: var(--font-size-sm)
    color: var(--text-tertiary)
  }
}

/* Summary section */
.employee-summary {
  padding: 16px 32px
  background: var(--bg-secondary)
  border-bottom: 1px solid var(--border-primary)
  display: flex
  gap: 32px
}

.summary-stat {
  display: flex
  flex-direction: column
  gap: 4px

  .stat-label {
    font-size: var(--font-size-xs)
    color: var(--text-tertiary)
    text-transform: uppercase
    letter-spacing: var(--letter-spacing-wide)
    font-weight: var(--font-weight-semibold)
  }

  .stat-value {
    font-size: var(--font-size-xl)
    font-weight: var(--font-weight-semibold)
    color: var(--text-primary)
  }

  .stat-value.mono {
    font-family: var(--font-family-mono)
  }
}
```

---

## Mini Calendar Preview Design

```css
.mini-calendar {
  padding: 16px 32px
  border-bottom: 1px solid var(--border-primary)
}

.mini-calendar-title {
  font-size: var(--font-size-sm)
  font-weight: var(--font-weight-semibold)
  color: var(--text-secondary)
  margin-bottom: 12px
}

.mini-calendar-grid {
  display: grid
  grid-template-columns: 60px 1fr
  gap: 8px
  background: var(--bg-secondary)
  border: 1px solid var(--border-primary)
  border-radius: var(--radius-sm)
  padding: 12px
}

.mini-time-label {
  font-family: var(--font-family-mono)
  font-size: 11px
  color: var(--text-tertiary)
  text-align: right
}

.mini-timeline {
  position: relative
  height: 100%
  min-height: 200px
}

.mini-block {
  position: absolute
  left: 0
  right: 0
  border-radius: 2px
  font-size: 11px
  padding: 4px
  overflow: hidden
  white-space: nowrap
  text-overflow: ellipsis
}
```

---

## Task List (Read-Only) Design

```css
.employee-task-list {
  padding: 24px 32px
  max-height: 400px
  overflow-y: auto
}

.task-list-item {
  display: flex
  align-items: center
  gap: 12px
  padding: 12px 0
  border-bottom: 1px solid var(--border-secondary)

  &:last-child {
    border-bottom: none
  }
}

.task-status-dot {
  width: 8px
  height: 8px
  border-radius: 50%
  flex-shrink: 0
}

.task-name {
  flex: 1
  font-size: 14px
  color: var(--text-primary)
}

.task-time-comparison {
  font-family: var(--font-family-mono)
  font-size: 13px
  color: var(--text-secondary)
  display: flex
  align-items: center
  gap: 6px

  .arrow {
    color: var(--text-tertiary)
  }

  .actual {
    font-weight: var(--font-weight-medium)
  }

  &.overrun .actual {
    color: var(--error-solid)
  }

  &.ahead .actual {
    color: var(--success-solid)
  }
}
```

---

## Date Filter Design

```css
.date-filter {
  display: flex
  gap: 4px
  background: var(--bg-secondary)
  padding: 4px
  border-radius: var(--radius-md)
}

.date-filter-option {
  padding: 8px 16px
  background: transparent
  border: none
  border-radius: var(--radius-sm)
  color: var(--text-secondary)
  font-size: 14px
  font-weight: var(--font-weight-medium)
  cursor: pointer
  transition: all 150ms ease-out

  &:hover {
    background: var(--bg-hover)
    color: var(--text-primary)
  }

  &.active {
    background: var(--bg-primary)
    color: var(--text-primary)
    box-shadow: var(--shadow-xs)
  }
}
```

---

## Database Queries

### Fetch Team Summary

```typescript
const fetchTeamProgress = async (date: Date = new Date()) => {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // Get all org members
  const { data: members } = await supabase
    .from('organization_members')
    .select(`
      user_id,
      user:user_profiles!user_id(display_name, email)
    `)
    .eq('organization_id', orgId);

  // Get tasks for each member (RLS filters by visibility)
  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      owner_id,
      expected_time_minutes,
      actual_time_minutes,
      status,
      calendar_blocks!inner(start_time)
    `)
    .eq('organization_id', orgId)
    .gte('calendar_blocks.start_time', dayStart.toISOString())
    .lt('calendar_blocks.start_time', dayEnd.toISOString());

  // Aggregate per user
  return members.map(member => {
    const userTasks = tasks.filter(t => t.owner_id === member.user_id);
    return {
      userId: member.user_id,
      displayName: member.user.display_name,
      taskCount: userTasks.length,
      totalExpected: sum(userTasks, 'expected_time_minutes'),
      totalActual: sum(userTasks, 'actual_time_minutes')
    };
  });
};
```

---

## Speed Calculation Logic

```typescript
type SpeedStatus = 'ahead' | 'on_track' | 'behind' | 'overrun';

function calculateSpeed(expected: number, actual: number): {
  percentage: number;
  status: SpeedStatus
} {
  if (expected === 0) return { percentage: 0, status: 'on_track' };

  const percentage = Math.round((actual / expected) * 100);

  let status: SpeedStatus;
  if (percentage > 100) status = 'overrun';
  else if (percentage > 90) status = 'behind';
  else if (percentage > 70) status = 'on_track';
  else status = 'ahead';

  return { percentage, status };
}
```

---

## Components

```
components/
├── progress/
│   ├── ProgressTable.tsx        # Main team table
│   ├── ProgressRow.tsx          # Single employee row
│   ├── SpeedIndicator.tsx       # Visual speed bar
│   ├── EmployeeModal.tsx        # Detailed task view
│   ├── MiniCalendar.tsx         # Timeline preview
│   ├── DateFilter.tsx           # Today/Yesterday/Custom
│   └── TaskList.tsx             # Read-only task list
└── ui/
    ├── ProgressBar.tsx
    └── Avatar.tsx
```

---

## Real-time Updates

```typescript
useEffect(() => {
  const channel = supabase
    .channel('org-tasks')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'tasks',
      filter: `organization_id=eq.${orgId}`
    }, () => {
      refetchTeamProgress();
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [orgId]);
```

---

## Acceptance Checklist

- [ ] Progress page only accessible to leaders (redirects employees)
- [ ] Table shows all org members with today's metrics by default
- [ ] Speed indicator accurately reflects actual vs expected with correct colors
- [ ] Click row opens employee detail modal with smooth animation
- [ ] Modal shows comprehensive summary stats
- [ ] Mini calendar preview visualizes day's schedule correctly
- [ ] Task list is read-only with proper status indicators
- [ ] Date filter allows viewing past days (Today/Yesterday/Custom)
- [ ] Real-time updates when team members log time
- [ ] Private tasks are NOT visible (RLS enforced)
- [ ] All tables follow design system specifications
- [ ] Typography uses Geist Sans/Mono appropriately
- [ ] Speed bars animate smoothly on load
- [ ] All hover states provide clear feedback
- [ ] Modal has proper focus trap for accessibility

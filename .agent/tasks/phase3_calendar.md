# Phase 3: Calendar Integration

## Overview

Build the week-based calendar view with drag-drop task scheduling and split-panel layout, maintaining the clean minimal aesthetic with premium feel.

---

## Layout Structure

```
┌──┬────────────────────────┬─┬────────────────────────┐
│≡ │     Task Table         │║│     Week Calendar      │
│  │                        │║│                        │
│  │  ┌──────────────────┐  │║│  Mon Tue Wed Thu Fri   │
│  │  │ Task 1      [▶]  │←─┼─draggable──→ ████████   │
│  │  │ Task 2      [⏸] │  │║│            ████████   │
│  │  │ Task 3      [▶]  │  │║│                        │
│  │  └──────────────────┘  │║│                        │
│  │                        │║│                        │
└──┴────────────────────────┴─┴────────────────────────┘
                             ↑
                    Draggable divider
```

---

## Split Panel Design Specifications

**Container**:
```css
display: flex
height: calc(100vh - 64px)  /* Minus header */
position: relative
overflow: hidden
```

**Left Panel (Tasks)**:
```css
flex: 0 0 {ratio}%  /* Default 40% */
min-width: 320px
max-width: 60%
overflow-y: auto
background: var(--bg-primary)
transition: flex 250ms ease-out
```

**Right Panel (Calendar)**:
```css
flex: 1
min-width: 400px
overflow-y: auto
background: var(--bg-primary)
transition: flex 250ms ease-out
```

---

## Draggable Divider Specifications

**Divider Base**:
```css
width: 1px
background: var(--border-primary)
cursor: col-resize
position: relative
transition: all 150ms ease-out
z-index: 10

&:hover {
  width: 4px
  background: var(--orange-600)
  opacity: 0.3
}

&:active {
  background: var(--orange-600)
  opacity: 0.6
}
```

**Close Buttons (on hover)**:
```css
.close-left, .close-right {
  position: absolute
  top: 50%
  transform: translateY(-50%)
  width: 24px
  height: 24px
  background: var(--bg-hover)
  border: 1px solid var(--border-primary)
  border-radius: var(--radius-sm)
  display: none
  align-items: center
  justify-content: center
  cursor: pointer
  transition: all 150ms ease-out

  svg {
    width: 16px
    height: 16px
    color: var(--text-secondary)
  }

  &:hover {
    background: var(--bg-active)
    border-color: var(--border-hover)

    svg {
      color: var(--text-primary)
    }
  }
}

.divider:hover .close-left,
.divider:hover .close-right {
  display: flex
}

.close-left {
  left: -32px
}

.close-right {
  right: -32px
}
```

---

## Calendar Grid Design

**Calendar Container**:
```css
padding: 24px
background: var(--bg-primary)
```

**Calendar Header**:
```css
display: flex
justify-content: space-between
align-items: center
margin-bottom: 24px

h2 {
  font-size: var(--font-size-2xl)
  font-weight: var(--font-weight-semibold)
  color: var(--text-primary)
}
```

**Week Navigation**:
```css
display: flex
gap: 8px

button {
  width: 32px
  height: 32px
  display: flex
  align-items: center
  justify-content: center
  background: transparent
  border: 1px solid var(--border-primary)
  border-radius: var(--radius-sm)
  color: var(--text-secondary)
  cursor: pointer
  transition: all 150ms ease-out

  &:hover {
    background: var(--bg-hover)
    border-color: var(--border-hover)
    color: var(--text-primary)
  }
}
```

**Week Grid**:
```css
display: grid
grid-template-columns: 60px repeat(5, 1fr)
gap: 0
border: 1px solid var(--border-primary)
border-radius: var(--radius-md)
overflow: hidden
background: var(--bg-primary)
```

**Day Header Cell**:
```css
padding: 12px 8px
text-align: center
border-bottom: 1px solid var(--border-primary)
border-right: 1px solid var(--border-secondary)
background: var(--bg-tertiary)

.day-name {
  font-size: var(--font-size-xs)
  font-weight: var(--font-weight-semibold)
  color: var(--text-tertiary)
  text-transform: uppercase
  letter-spacing: var(--letter-spacing-wide)
}

.day-date {
  font-size: var(--font-size-lg)
  font-weight: var(--font-weight-semibold)
  color: var(--text-primary)
  margin-top: 4px
}

&.today {
  background: var(--orange-50)

  .day-date {
    color: var(--orange-600)
  }
}
```

**Time Axis (Y-axis)**:
```css
font-family: var(--font-family-mono)
font-size: var(--font-size-xs)
color: var(--text-tertiary)
text-align: right
padding: 8px
border-right: 1px solid var(--border-primary)
background: var(--bg-secondary)
```

**Time Slot Cell**:
```css
min-height: 60px  /* 1 hour = 60px */
border-right: 1px solid var(--border-secondary)
border-bottom: 1px solid var(--border-secondary)
position: relative
transition: background 150ms ease-out

&:hover {
  background: var(--bg-hover)
}

/* Half-hour line */
&::after {
  content: ''
  position: absolute
  top: 50%
  left: 0
  right: 0
  height: 1px
  background: var(--border-secondary)
  opacity: 0.5
}
```

---

## Calendar Task Block Design

```css
.calendar-block {
  position: absolute
  left: 4px
  right: 4px
  border-radius: var(--radius-sm)
  padding: 8px
  cursor: pointer
  overflow: hidden
  transition: all 150ms ease-out
  box-shadow: var(--shadow-xs)

  &:hover {
    box-shadow: var(--shadow-sm)
    transform: translateY(-1px)
  }

  /* Dragging state */
  &.dragging {
    opacity: 0.5
    cursor: grabbing
  }
}

/* Status-based colors */
.calendar-block.planned {
  background: var(--info-bg)
  border-left: 3px solid var(--info-solid)
  color: var(--info-text)
}

.calendar-block.in-progress {
  background: var(--warning-bg)
  border-left: 3px solid var(--warning-solid)
  color: var(--warning-text)
}

.calendar-block.completed {
  background: var(--success-bg)
  border-left: 3px solid var(--success-solid)
  color: var(--success-text)
}

.calendar-block.overrun {
  background: var(--error-bg)
  border-left: 3px solid var(--error-solid)
  color: var(--error-text)
}

/* Block content */
.block-title {
  font-size: 13px
  font-weight: var(--font-weight-semibold)
  margin-bottom: 4px
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap
}

.block-time {
  font-family: var(--font-family-mono)
  font-size: 11px
  opacity: 0.8
}

/* Resize Handle */
.resize-handle {
  position: absolute
  bottom: 0
  left: 0
  right: 0
  height: 8px
  cursor: ns-resize
  background: transparent

  &:hover {
    background: rgba(0, 0, 0, 0.1)
  }
}
```

---

## Drag-Drop Implementation with @dnd-kit

```typescript
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';

// Draggable Task Row
function DraggableTaskRow({ task }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task }
  });

  return (
    <tr
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={isDragging ? 'opacity-50' : ''}
    >
      {/* Task row content */}
    </tr>
  );
}

// Droppable Calendar Slot
function DroppableTimeSlot({ time, day }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${day}-${time}`,
    data: { time, day }
  });

  return (
    <div
      ref={setNodeRef}
      className={`time-slot ${isOver ? 'bg-orange-50' : ''}`}
    >
      {/* Slot content */}
    </div>
  );
}
```

---

## Database Interactions

### Create Calendar Block

```typescript
const createCalendarBlock = async (taskId: string, startTime: Date) => {
  const task = tasks.find(t => t.id === taskId);
  const endTime = addMinutes(startTime, task.expected_time_minutes);

  const { data, error } = await supabase
    .from('calendar_blocks')
    .insert({
      task_id: taskId,
      organization_id: orgId,
      owner_id: userId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString()
    })
    .select()
    .single();

  if (error?.code === '23P01') {
    // EXCLUDE constraint violation = double booking
    toast.error('Time slot already occupied');
  }
  return data;
};
```

### Resize Block (Update Time)

```typescript
const resizeBlock = async (blockId: string, newEndTime: Date) => {
  const block = blocks.find(b => b.id === blockId);
  const newDuration = differenceInMinutes(newEndTime, new Date(block.start_time));

  // Update block end time
  await supabase.from('calendar_blocks')
    .update({ end_time: newEndTime.toISOString() })
    .eq('id', blockId);

  // Sync task expected time
  await supabase.from('tasks')
    .update({ expected_time_minutes: newDuration })
    .eq('id', block.task_id);
};
```

---

## Team Overlay Filter Design

```css
.team-filter {
  display: flex
  gap: 8px
  padding: 12px
  background: var(--bg-secondary)
  border-radius: var(--radius-md)
  margin-bottom: 16px
}

.user-chip {
  display: inline-flex
  align-items: center
  gap: 6px
  padding: 6px 12px
  background: var(--bg-primary)
  border: 1px solid var(--border-primary)
  border-radius: var(--radius-full)
  font-size: 13px
  color: var(--text-primary)
  cursor: pointer
  transition: all 150ms ease-out

  &:hover {
    border-color: var(--border-hover)
    background: var(--bg-hover)
  }

  &.active {
    background: var(--orange-600)
    border-color: var(--orange-600)
    color: white
  }
}
```

---

## Components

```
components/
├── calendar/
│   ├── WeekCalendar.tsx     # Main calendar grid
│   ├── DayColumn.tsx        # Single day column
│   ├── TimeSlot.tsx         # Hour row (droppable)
│   ├── CalendarBlock.tsx    # Task block (draggable/resizable)
│   ├── CalendarHeader.tsx   # Week navigation
│   └── TeamFilter.tsx       # User overlay selector
├── layout/
│   ├── SplitPanel.tsx       # Container with draggable divider
│   └── Divider.tsx          # The vertical divider handle
└── dnd/
    ├── DndContext.tsx       # @dnd-kit provider
    ├── Draggable.tsx        # Draggable wrapper
    └── Droppable.tsx        # Droppable wrapper
```

---

## Animations

**Drag Start**:
```css
@keyframes lift {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.05);
    box-shadow: var(--shadow-lg);
  }
}
```

**Drop**:
```css
@keyframes drop {
  from {
    transform: scale(1.05);
    opacity: 0.8;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

animation: drop 200ms ease-out;
```

**Block Creation**:
```css
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

animation: fadeInScale 200ms ease-out;
```

---

## Acceptance Checklist

- [ ] Week calendar displays current week with proper grid
- [ ] Navigation arrows change week smoothly
- [ ] Tasks can be dragged from table to calendar with visual feedback
- [ ] Dropping creates block at correct time with animation
- [ ] Block height accurately represents expected time (1px = 1min)
- [ ] Blocks show correct semantic colors based on status
- [ ] Resizing block updates expected time bidirectionally
- [ ] Double-booking prevented with error toast
- [ ] Divider can be dragged to resize panels (40/60 default)
- [ ] Collapse buttons work with smooth transitions
- [ ] UI state persists across sessions in user_preferences
- [ ] Team overlay filter works for same-org users (RLS filtered)
- [ ] All hover states provide clear feedback
- [ ] Typography uses Geist Sans/Mono appropriately
- [ ] Calendar respects work hours from user preferences
- [ ] Today's date is highlighted with orange accent

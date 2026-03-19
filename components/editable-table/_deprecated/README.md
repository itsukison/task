# Deprecated: Default Table Variant

The `EditableTable` component supports two variants: `'default'` and `'minimal'`.

As of March 2026, the **`minimal` variant is now the active default** for the workspace task list. The `default` variant is no longer used in production but its code is preserved in the editable-table source files as conditional branches (guarded by `variant === 'default'` / `variant !== 'minimal'` checks).

## Where the default variant code lives

| File | Description |
|------|-------------|
| `EditableTable.tsx` | `variant !== 'minimal'` branch renders the full `<TableHeader>` with column resizing |
| `TableBody.tsx` | `variant` prop passed down to rows for row styling differences |
| `useTableColumns.tsx` | Column header click handlers & resize handles active in `default` variant |
| `task-list.tsx` | `tableVariant !== 'minimal'` guards around the day-section title and toolbar |

## To restore the default variant

Set `tableVariant = 'default'` in `app/(dashboard)/workspace/page.tsx` (or re-derive it from a URL param / user preference).

---

# Deprecated: Task List Expand/Collapse

The task list previously had an expand/collapse mechanism that constrained the list to show only the selected day's tasks when collapsed, and showed the full scrollable list when expanded.

As of March 2026, the task list **always shows the full vertically-scrollable list**. The expand/collapse UI and logic have been removed.

## What was removed

| Location | What was removed |
|----------|-----------------|
| `components/task-list.tsx` | `isExpanded` state, `handleToggleExpand`, `useEffect` syncing from `preferences.tasks_collapsed`, `collapsedTopFadePx` / `collapsedBottomFadePx` / `collapsedContentGapPx` constants, `collapsedViewportHeight` useMemo, `ChevronDown`/`ChevronUp` imports, collapsed fade overlay block, expand/collapse button blocks |
| `lib/hooks/use-task-virtualizer.ts` | `isExpanded` prop from interface and destructuring, `useEffect` "Prevent scroll while collapsed" (wheel/touchmove preventDefault) |

## What was NOT removed

- `useUserPreferences` / `tasks_collapsed` DB column — the preference column still exists in the database but is no longer read or written by the task list.
- Translations `common.expand` / `common.collapse` — left in place as they may be used elsewhere.

## To restore expand/collapse

Revert the changes to `components/task-list.tsx` and `lib/hooks/use-task-virtualizer.ts` using git history.

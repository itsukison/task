# Database Schema Summary

## 1. organizations
*   **Columns**: `id`, `name`, `created_at`, `updated_at`
*   **Purpose**: Root entity for multi-tenancy.
*   **Policies**:
    *   `SELECT`: Viewable by members.
    *   `UPDATE`: Editable by leaders.
    *   `DELETE`: Blocked (Admin only).

## 2. organization_members
*   **Columns**: `id`, `organization_id`, `user_id`, `role` (enum: 'leader', 'employee')
*   **Purpose**: Links users to organizations and defines permissions.
*   **Policies**:
    *   `SELECT`: Viewable by org members.
    *   `INSERT/UPDATE/DELETE`: Managed by leaders (cannot remove self).

## 3. user_profiles
*   **Columns**: `id` (auth.uid), `display_name`, `email`, `default_schedule_visibility`, `default_task_visibility`
*   **Purpose**: User details and default privacy settings.
*   **Policies**:
    *   `SELECT`: Viewable by self and org members.
    *   `UPDATE`: Editable by self.

## 4. tasks
*   **Columns**: `id`, `organization_id`, `owner_id`, `status` (planned, in_progress, etc.), `expected/actual_time_minutes`, `visibility` (private, team, leaders_only)
*   **Purpose**: Core unit of work. Tracks status and time.
*   **Policies**:
    *   `SELECT`: Based on `visibility` (Owner + Leaders + Team if shared).
    *   `INSERT`: Org members.
    *   `UPDATE`: Owner or Leader.
    *   `DELETE`: Owner or Leader (Soft delete).

## 5. calendar_blocks
*   **Columns**: `task_id`, `start_time`, `end_time`, `owner_id`
*   **Purpose**: Scheduling tasks on a calendar.
*   **Policies**:
    *   `SELECT`: Inherits `tasks` visibility.
    *   `INSERT/UPDATE/DELETE`: Owner only ("Task owners manage their schedule").

## 6. time_logs
*   **Columns**: `task_id`, `user_id`, `started_at`, `ended_at`, `duration_minutes`
*   **Purpose**: Actual time tracking.
*   **Policies**:
    *   `SELECT`: Viewable by self and leaders.
    *   `INSERT/UPDATE`: Managed by self.

## 7. user_preferences
*   **Columns**: `user_id`, `organization_id`, `calendar_tasks_split_ratio`, `work_start/end_time`
*   **Purpose**: UI state and per-org settings.
*   **Policies**:
    *   `ALL`: Managed by self (Owner only).

## 8. audit_logs
*   **Columns**: `action`, `table_name`, `record_id`, `old_data`, `new_data`
*   **Purpose**: Compliance trail for sensitive actions.
*   **Policies**:
    *   `SELECT`: Leaders only.
    *   `INSERT`: System only (blocked for users).

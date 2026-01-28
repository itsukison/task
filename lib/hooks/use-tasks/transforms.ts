import { Task, OwnerProfile } from '@/lib/types';

/**
 * Raw task data from RPC function
 */
export interface RpcTaskData {
  id: string;
  organization_id: string;
  owner_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  status: string;
  expected_time_minutes: number;
  actual_time_minutes: number;
  visibility: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  scheduled_date: string | null;
  task_owners: Array<{
    id: string;
    display_name: string;
    email: string;
    status: 'pending' | 'confirmed';
    assigned_by: string | null;
  }> | null;
}

/**
 * Transform RPC result to Task
 *
 * Converts snake_case database format to camelCase frontend format
 */
export function rpcToTask(row: RpcTaskData): Task {
  const owners: OwnerProfile[] = (row.task_owners || []).map(to => ({
    id: to.id,
    display_name: to.display_name,
    email: to.email,
    status: to.status,
    assignedBy: to.assigned_by ?? undefined,
  }));

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as 'planned' | 'in_progress' | 'overrun' | 'completed',
    expectedTime: row.expected_time_minutes,
    actualTime: row.actual_time_minutes,
    visibility: row.visibility as 'private' | 'team' | 'leaders_only',
    owners,
    ownerId: row.owner_id, // Deprecated but kept for backward compatibility
    organizationId: row.organization_id,
    scheduledDate: row.scheduled_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Transform array of RPC results to Tasks
 */
export function rpcToTasks(rows: RpcTaskData[]): Task[] {
  return rows.map(rpcToTask);
}

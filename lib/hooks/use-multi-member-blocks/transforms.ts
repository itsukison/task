import { MultiMemberBlock } from '@/lib/types';

// Color palette for different users (Notion-style subtle colors)
export const USER_COLORS = [
  '#FF5500', // Orange (primary)
  '#0066FF', // Blue
  '#00AA66', // Green
  '#AA00FF', // Purple
  '#FF0066', // Pink
  '#00AAFF', // Cyan
  '#FFAA00', // Amber
  '#66AA00', // Lime
];

/**
 * Raw block data from RPC function
 */
export interface RpcBlockData {
  id: string;
  task_id: string;
  organization_id: string;
  start_time: string;
  end_time: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  owner_display_name: string | null;
  owner_email: string | null;
  owner_schedule_visibility: string | null;
  task_title: string | null;
  task_status: string | null;
  task_expected_time_minutes: number | null;
  task_visibility: string | null;
  task_owners: Array<{
    id: string;
    display_name: string;
    email: string;
    status: 'pending' | 'confirmed';
  }> | null;
}

/**
 * Transform RPC result to MultiMemberBlock
 *
 * Converts snake_case database format to camelCase frontend format
 * and assigns color based on owner index
 */
export function rpcToMultiMemberBlock(
  row: RpcBlockData,
  colorIndex: number
): MultiMemberBlock {
  return {
    id: row.id,
    taskId: row.task_id,
    startTime: row.start_time,
    endTime: row.end_time,
    ownerId: row.owner_id,
    organizationId: row.organization_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ownerName: row.owner_display_name || 'Unknown',
    ownerColor: USER_COLORS[colorIndex % USER_COLORS.length],
    task: row.task_title
      ? {
          id: row.task_id,
          title: row.task_title,
          description: null,
          status: (row.task_status as 'planned' | 'in_progress' | 'overrun' | 'completed') || 'planned',
          expectedTime: row.task_expected_time_minutes ?? 30,
          actualTime: 0,
          visibility: (row.task_visibility as 'private' | 'team' | 'leaders_only') || 'team',
          owners: row.task_owners || [],
          ownerId: row.owner_id,
          organizationId: row.organization_id,
          scheduledDate: null,
          parentTaskId: null,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }
      : undefined,
  };
}

/**
 * Assign colors to blocks based on unique owner IDs
 *
 * Ensures consistent colors for the same owner across renders
 */
export function assignBlockColors(blocks: RpcBlockData[]): MultiMemberBlock[] {
  // Get unique owner IDs in order of first appearance
  const uniqueOwnerIds: string[] = [];
  const ownerColorIndexMap = new Map<string, number>();

  blocks.forEach((block) => {
    if (!ownerColorIndexMap.has(block.owner_id)) {
      ownerColorIndexMap.set(block.owner_id, uniqueOwnerIds.length);
      uniqueOwnerIds.push(block.owner_id);
    }
  });

  // Transform blocks with assigned colors
  return blocks.map((block) => {
    const colorIndex = ownerColorIndexMap.get(block.owner_id) || 0;
    return rpcToMultiMemberBlock(block, colorIndex);
  });
}

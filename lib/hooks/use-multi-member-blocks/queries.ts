'use client';

import { useSupabaseQuery } from '@/lib/query/hooks/base';
import { queryKeys } from '@/lib/query/keys';
import { useAuth } from '@/lib/auth/hooks';
import { useCurrentUserRole } from '../shared/use-current-user-role';
import { supabase } from '@/lib/supabase';
import { MultiMemberBlock } from '@/lib/types';
import { assignBlockColors, type RpcBlockData } from './transforms';
import { startOfWeek, addDays } from 'date-fns';

export interface UseMultiMemberBlocksDataParams {
  selectedMemberIds: string[];
  viewDate: Date;
  showWeekends?: boolean;
}

/**
 * Fetch multi-member calendar blocks using optimized RPC call
 *
 * This replaces 7 sequential queries with a single database call:
 * 1. Owned blocks
 * 2. Task assignments
 * 3. Assigned blocks
 * 4. Tasks
 * 5. User profiles
 * 6. Task owners
 * 7. Client-side visibility filtering
 *
 * Now all of this is done server-side in one query with proper indexes.
 */
export function useMultiMemberBlocksData({
  selectedMemberIds,
  viewDate,
  showWeekends = false,
}: UseMultiMemberBlocksDataParams) {
  const { user, currentOrg } = useAuth();
  const { data: userRole } = useCurrentUserRole();

  // Calculate week range
  const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = showWeekends ? addDays(weekStart, 6) : addDays(weekStart, 4); // Sunday or Friday

  weekStart.setHours(0, 0, 0, 0);
  weekEnd.setHours(23, 59, 59, 999);

  return useSupabaseQuery<MultiMemberBlock[]>(
    [...queryKeys.multiMemberBlocks.byMembers(
      currentOrg?.id || '',
      selectedMemberIds,
      weekStart.toISOString(),
      weekEnd.toISOString()
    )],
    async () => {
      if (!currentOrg || !user || selectedMemberIds.length === 0 || !userRole) {
        return { data: [], error: null };
      }

      // Call RPC function - single query replaces 7 sequential queries
      const result = await (supabase.rpc as any)('get_multi_member_blocks', {
        p_org_id: currentOrg.id,
        p_user_id: user.id,
        p_member_ids: selectedMemberIds,
        p_start_time: weekStart.toISOString(),
        p_end_time: weekEnd.toISOString(),
        p_user_role: userRole,
      });

      if (result.error) {
        return { data: null, error: result.error };
      }

      // Transform and assign colors
      const transformed = assignBlockColors((result.data || []) as RpcBlockData[]);
      return { data: transformed, error: null };
    },
    {
      enabled: !!currentOrg && !!user && selectedMemberIds.length > 0 && !!userRole,
      staleTime: 30000, // 30 seconds
    }
  );
}

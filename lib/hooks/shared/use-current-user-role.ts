'use client';

import { useSupabaseQuery } from '@/lib/query/hooks/base';
import { queryKeys } from '@/lib/query/keys';
import { useAuth } from '@/lib/auth/hooks';
import { supabase } from '@/lib/supabase';

/**
 * Cached role query prevents repeated fetches across all hooks
 *
 * This hook eliminates the role-fetch waterfall that was blocking
 * data queries in multiple hooks (use-multi-member-blocks, use-team-tasks, etc.)
 *
 * Features:
 * - 5-minute cache (roles rarely change)
 * - Shared across all components (React Query deduplication)
 * - Automatically refetches on org/user change
 */
export function useCurrentUserRole() {
  const { user, currentOrg } = useAuth();

  return useSupabaseQuery(
    [...queryKeys.userRole.byUser(currentOrg?.id || '', user?.id || '')],
    async () => {
      if (!currentOrg || !user) {
        return { data: null, error: null };
      }

      const result = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', currentOrg.id)
        .eq('user_id', user.id)
        .single();

      return { data: result.data?.role || null, error: result.error };
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes (roles rarely change)
      enabled: !!currentOrg && !!user,
    }
  );
}

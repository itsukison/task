'use client';

import { useSubscription } from '../shared/subscription-utils';
import { queryKeys } from '@/lib/query/keys';
import { useAuth } from '@/lib/auth/hooks';

export interface UseMultiMemberBlocksSubscriptionParams {
  selectedMemberIds: string[];
  weekStart: string;
  weekEnd: string;
}

/**
 * Subscribe to real-time updates for multi-member calendar blocks
 *
 * Features:
 * - Single subscription (not multiple)
 * - Debounced invalidation (500ms) to prevent refetch storms
 * - Automatically unsubscribes on unmount
 *
 * Watches calendar_blocks table for changes and invalidates
 * the appropriate queries.
 */
export function useMultiMemberBlocksSubscription({
  selectedMemberIds,
  weekStart,
  weekEnd,
}: UseMultiMemberBlocksSubscriptionParams) {
  const { currentOrg } = useAuth();

  useSubscription({
    channel: `multi_member_blocks:${currentOrg?.id}`,
    table: 'calendar_blocks',
    filter: currentOrg ? `organization_id=eq.${currentOrg.id}` : undefined,
    queryKeys: [
      // Invalidate queries for this specific member set and date range
      [...queryKeys.multiMemberBlocks.byMembers(
        currentOrg?.id || '',
        selectedMemberIds,
        weekStart,
        weekEnd
      )],
      // Also invalidate all multi-member block queries for this org
      [...queryKeys.multiMemberBlocks.all],
    ],
    debounceMs: 500,
  });
}

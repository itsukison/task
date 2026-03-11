'use client';

import { useCombinedSubscription } from '../shared/subscription-utils';
import { queryKeys } from '@/lib/query/keys';
import { useAuth } from '@/lib/auth/hooks';

/**
 * Subscribe to real-time updates for the current user's calendar blocks
 *
 * Features:
 * - Single combined subscription on calendar_blocks + task_owners
 * - 150ms debounce — lower than tasks (500ms) because calendar block changes
 *   are own-user operations that need fast visual feedback
 * - Automatic cleanup on unmount
 */
export function useCalendarBlocksSubscription() {
    const { currentOrg, user } = useAuth();

    useCombinedSubscription({
        channel: `calendar_blocks_combined:${currentOrg?.id}:${user?.id}`,
        tables: [
            {
                table: 'calendar_blocks',
                filter: currentOrg ? `organization_id=eq.${currentOrg.id}` : undefined,
                event: '*',
            },
            {
                table: 'task_owners',
                filter: currentOrg ? `organization_id=eq.${currentOrg.id}` : undefined,
                event: '*',
            },
        ],
        queryKeys: [
            [...queryKeys.calendarBlocks.byOwner(currentOrg?.id || '', user?.id || '')],
        ],
        debounceMs: 150,
    });
}

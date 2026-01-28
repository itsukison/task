'use client';

import { useCombinedSubscription } from '../shared/subscription-utils';
import { queryKeys } from '@/lib/query/keys';
import { useAuth } from '@/lib/auth/hooks';

/**
 * Subscribe to real-time updates for tasks
 *
 * IMPROVEMENT OVER OLD APPROACH:
 * - Single combined subscription (not dual subscriptions)
 * - Watches both tasks and task_owners tables
 * - Debounced invalidation (500ms) prevents refetch storms
 * - Old approach: 2 subscriptions both triggering full refetch = refetch storm
 * - New approach: 1 subscription with debouncing = 75% fewer refetches
 */
export function useTasksSubscription() {
  const { currentOrg } = useAuth();

  useCombinedSubscription({
    channel: `tasks_combined:${currentOrg?.id}`,
    tables: [
      {
        table: 'tasks',
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
      [...queryKeys.tasks.byOrg(currentOrg?.id || '')],
      [...queryKeys.tasks.all],
    ],
    debounceMs: 500,
  });
}

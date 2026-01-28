import { useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Debounce helper to prevent subscription refetch storms
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Configuration for creating a debounced subscription
 */
export interface SubscriptionConfig {
  channel: string;
  table: string;
  schema?: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  queryKeys: unknown[][];
  debounceMs?: number;
}

/**
 * Creates a debounced Supabase real-time subscription
 *
 * Features:
 * - Debounces invalidation to prevent refetch storms
 * - Invalidates multiple query keys at once
 * - Automatic cleanup on unmount
 *
 * Example:
 * ```ts
 * useSubscription({
 *   channel: 'tasks:org-123',
 *   table: 'tasks',
 *   filter: 'organization_id=eq.123',
 *   queryKeys: [queryKeys.tasks.byOrg('123')],
 *   debounceMs: 500,
 * });
 * ```
 */
export function useSubscription(config: SubscriptionConfig) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const {
      channel,
      table,
      schema = 'public',
      filter,
      event = '*',
      queryKeys,
      debounceMs = 500,
    } = config;

    // Create debounced invalidation function
    const debouncedInvalidate = debounce(() => {
      queryKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    }, debounceMs);

    // Subscribe to changes
    const subscriptionChannel = supabase
      .channel(channel)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema,
          table,
          filter,
        } as any,
        debouncedInvalidate
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(subscriptionChannel);
    };
  }, [
    config.channel,
    config.table,
    config.schema,
    config.filter,
    config.event,
    config.debounceMs,
    JSON.stringify(config.queryKeys),
    queryClient,
  ]);
}

/**
 * Creates a combined subscription watching multiple tables
 *
 * Useful for cases like tasks + task_owners where both tables
 * should trigger the same invalidation
 *
 * Example:
 * ```ts
 * useCombinedSubscription({
 *   channel: 'tasks-combined:org-123',
 *   tables: [
 *     { table: 'tasks', filter: 'organization_id=eq.123' },
 *     { table: 'task_owners', filter: 'organization_id=eq.123' },
 *   ],
 *   queryKeys: [queryKeys.tasks.byOrg('123')],
 *   debounceMs: 500,
 * });
 * ```
 */
export function useCombinedSubscription(config: {
  channel: string;
  tables: Array<{ table: string; filter?: string; event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*' }>;
  queryKeys: unknown[][];
  schema?: string;
  debounceMs?: number;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const {
      channel,
      tables,
      queryKeys,
      schema = 'public',
      debounceMs = 500,
    } = config;

    // Create debounced invalidation function
    const debouncedInvalidate = debounce(() => {
      queryKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    }, debounceMs);

    // Create channel and subscribe to all tables
    let subscriptionChannel = supabase.channel(channel);

    tables.forEach(({ table, filter, event = '*' }) => {
      subscriptionChannel = subscriptionChannel.on(
        'postgres_changes' as any,
        {
          event,
          schema,
          table,
          filter,
        } as any,
        debouncedInvalidate
      );
    });

    subscriptionChannel.subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(subscriptionChannel);
    };
  }, [
    config.channel,
    JSON.stringify(config.tables),
    JSON.stringify(config.queryKeys),
    config.schema,
    config.debounceMs,
    queryClient,
  ]);
}

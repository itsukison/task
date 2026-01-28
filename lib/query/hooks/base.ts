import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { PostgrestError } from '@supabase/supabase-js';

type SupabaseResponse<T> = {
  data: T | null;
  error: PostgrestError | null;
};

/**
 * Base wrapper for Supabase queries with React Query
 * Automatically handles error throwing and null data
 */
export function useSupabaseQuery<T>(
  queryKey: unknown[],
  queryFn: () => Promise<SupabaseResponse<T>>,
  options?: Omit<UseQueryOptions<T, PostgrestError, T, unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await queryFn();
      if (error) throw error;
      return data as T;
    },
    ...options,
  });
}

/**
 * Base wrapper for Supabase mutations with React Query
 * Provides optimistic updates and automatic error handling
 */
export function useSupabaseMutation<TData, TVariables>(
  mutationFn: (vars: TVariables) => Promise<SupabaseResponse<TData>>,
  options?: Omit<UseMutationOptions<TData, PostgrestError, TVariables>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: async (vars: TVariables) => {
      const { data, error } = await mutationFn(vars);
      if (error) throw error;
      return data as TData;
    },
    ...options,
  });
}

/**
 * Hook to access the query client for manual cache updates
 */
export function useQueryInvalidation() {
  const queryClient = useQueryClient();

  return {
    invalidateQueries: (queryKey: unknown[]) => queryClient.invalidateQueries({ queryKey }),
    setQueryData: <T,>(queryKey: unknown[], updater: T | ((old: T | undefined) => T)) =>
      queryClient.setQueryData(queryKey, updater),
    getQueryData: <T,>(queryKey: unknown[]) => queryClient.getQueryData<T>(queryKey),
  };
}

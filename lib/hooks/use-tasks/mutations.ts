'use client';

import { useSupabaseMutation } from '@/lib/query/hooks/base';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { useAuth } from '@/lib/auth/hooks';
import { supabase } from '@/lib/supabase';
import { Task, TaskStatus, TaskVisibility } from '@/lib/types';
import { rpcToTask, type RpcTaskData } from './transforms';

// Input types
export interface CreateTaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  expectedTime: number;
  visibility?: TaskVisibility;
  scheduledDate?: string | null;
  parentTaskId?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  expectedTime?: number;
  actualTime?: number;
  visibility?: TaskVisibility;
  scheduledDate?: string | null;
  ownerIds?: string[];
}

/**
 * Mutation hook for creating tasks
 *
 * Uses atomic RPC function to create task + task_owner in one transaction
 * Prevents waterfall: insert task → insert owner → refetch all
 */
export function useCreateTask() {
  const { user, currentOrg, profile } = useAuth();
  const queryClient = useQueryClient();

  return useSupabaseMutation(
    async (input: CreateTaskInput) => {
      if (!user || !currentOrg) {
        throw new Error('Must be authenticated with an organization');
      }

      // Call atomic RPC function
      const result = await (supabase.rpc as any)('create_task_with_owner', {
        p_org_id: currentOrg.id,
        p_user_id: user.id,
        p_title: input.title,
        p_description: input.description || '',
        p_status: input.status || 'planned',
        p_expected_time_minutes: input.expectedTime,
        p_visibility: input.visibility || profile?.default_task_visibility || 'team',
        p_scheduled_date: input.scheduledDate || null,
      });

      if (result.error) throw result.error;

      // Set parent_task_id if this is a subtask
      const newTaskId = result.data?.[0]?.id;
      if (input.parentTaskId && newTaskId) {
        const updateResult = await supabase
          .from('tasks')
          .update({ parent_task_id: input.parentTaskId })
          .eq('id', newTaskId);
        if (updateResult.error) throw updateResult.error;
      }

      return result;
    },
    {
      onMutate: async (input: CreateTaskInput) => {
        const queryKey = [...queryKeys.tasks.byUser(currentOrg?.id || '', user?.id || '')];
        await queryClient.cancelQueries({ queryKey });
        const previousTasks = queryClient.getQueryData<Task[]>(queryKey);

        const tempId = `temp_${Date.now()}`;
        const tempTask: Task = {
          id: tempId,
          title: input.title,
          description: input.description ?? null,
          status: input.status || 'planned',
          expectedTime: input.expectedTime,
          actualTime: 0,
          visibility: input.visibility || (profile as any)?.default_task_visibility || 'team',
          owners: user && profile ? [{ id: user.id, display_name: (profile as any).display_name || '', email: user.email || '', status: 'confirmed' as const }] : [],
          ownerId: user?.id || '',
          organizationId: currentOrg?.id || '',
          scheduledDate: input.scheduledDate ?? null,
          parentTaskId: input.parentTaskId ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        queryClient.setQueryData<Task[]>(queryKey, (old) => [tempTask, ...(old || [])]);
        return { previousTasks, tempId };
      },
      onSuccess: (result: any, _vars: any, context: any) => {
        const queryKey = [...queryKeys.tasks.byUser(currentOrg?.id || '', user?.id || '')];
        const realRow = result?.data?.[0];
        if (realRow && context?.tempId) {
          queryClient.setQueryData<Task[]>(queryKey, (old) =>
            (old || []).map(t => t.id === context.tempId ? rpcToTask(realRow as RpcTaskData) : t)
          );
        }
        queryClient.invalidateQueries({ queryKey });
      },
      onError: (_err: any, _vars: any, context: any) => {
        if (context?.previousTasks) {
          const queryKey = [...queryKeys.tasks.byUser(currentOrg?.id || '', user?.id || '')];
          queryClient.setQueryData(queryKey, context.previousTasks);
        }
      },
    }
  );
}

/**
 * Mutation hook for updating tasks
 *
 * Supports partial updates with optimistic UI updates
 */
export function useUpdateTask() {
  const { user, currentOrg } = useAuth();
  const queryClient = useQueryClient();

  return useSupabaseMutation(
    async ({ id, input }: { id: string; input: UpdateTaskInput }) => {
      if (!currentOrg) {
        throw new Error('Must be authenticated with an organization');
      }

      // Build update data
      const updateData: Record<string, any> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.expectedTime !== undefined) updateData.expected_time_minutes = input.expectedTime;
      if (input.actualTime !== undefined) updateData.actual_time_minutes = input.actualTime;
      if (input.visibility !== undefined) updateData.visibility = input.visibility;
      if (input.scheduledDate !== undefined) updateData.scheduled_date = input.scheduledDate;

      // Update task
      const result = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .eq('organization_id', currentOrg.id);

      if (result.error) throw result.error;

      // Handle owner updates if provided
      if (input.ownerIds !== undefined && user) {
        // Get existing owners
        const { data: existingOwners } = await supabase
          .from('task_owners')
          .select('user_id, status')
          .eq('task_id', id);

        const existingUserIds = new Set(existingOwners?.map(o => o.user_id) || []);
        const newUserIds = new Set(input.ownerIds);

        // Remove owners not in new list
        const toRemove = [...existingUserIds].filter(uid => !newUserIds.has(uid));
        if (toRemove.length > 0) {
          await supabase
            .from('task_owners')
            .delete()
            .eq('task_id', id)
            .in('user_id', toRemove);
        }

        // Add new owners (pending unless self-assignment)
        const toAdd = [...newUserIds].filter(uid => !existingUserIds.has(uid));
        if (toAdd.length > 0) {
          const ownerInserts = toAdd.map(userId => ({
            task_id: id,
            user_id: userId,
            organization_id: currentOrg.id,
            assigned_by: user.id,
            status: userId === user.id ? 'confirmed' as const : 'pending' as const,
          }));

          const { error: insertError } = await supabase
            .from('task_owners')
            .insert(ownerInserts);

          if (insertError) throw insertError;
        }
      }

      return result;
    },
    {
      onMutate: async ({ id, input }: { id: string; input: UpdateTaskInput }) => {
        const queryKey = [...queryKeys.tasks.byUser(currentOrg?.id || '', user?.id || '')];
        await queryClient.cancelQueries({ queryKey });

        const previousTasks = queryClient.getQueryData<Task[]>(queryKey);

        queryClient.setQueryData<Task[]>(queryKey, (old) =>
          (old || []).map((task) => {
            if (task.id !== id) return task;
            return {
              ...task,
              ...(input.title !== undefined && { title: input.title }),
              ...(input.description !== undefined && { description: input.description }),
              ...(input.status !== undefined && { status: input.status }),
              ...(input.expectedTime !== undefined && { expectedTime: input.expectedTime }),
              ...(input.actualTime !== undefined && { actualTime: input.actualTime }),
              ...(input.visibility !== undefined && { visibility: input.visibility }),
              ...(input.scheduledDate !== undefined && { scheduledDate: input.scheduledDate }),
            };
          })
        );

        return { previousTasks };
      },
      onError: (_err: any, _vars: any, context: any) => {
        if (context?.previousTasks) {
          const queryKey = [...queryKeys.tasks.byUser(currentOrg?.id || '', user?.id || '')];
          queryClient.setQueryData(queryKey, context.previousTasks);
        }
      },
      onSuccess: () => {
        // Invalidate tasks query
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.tasks.byUser(currentOrg?.id || '', user?.id || '')]
        });
      },
    }
  );
}

/**
 * Mutation hook for soft-deleting tasks
 */
export function useDeleteTask() {
  const { currentOrg, user } = useAuth();
  const queryClient = useQueryClient();

  return useSupabaseMutation(
    async (id: string) => {
      if (!currentOrg) {
        throw new Error('Must be authenticated with an organization');
      }

      // Use RPC function for soft delete
      return await supabase.rpc('soft_delete_task', {
        task_id: id,
      });
    },
    {
      onMutate: async (id: string) => {
        // Optimistically remove from cache
        const queryKey = [...queryKeys.tasks.byUser(currentOrg?.id || '', user?.id || '')];
        await queryClient.cancelQueries({ queryKey });

        const previousTasks = queryClient.getQueryData<Task[]>(queryKey);

        queryClient.setQueryData<Task[]>(queryKey, (old) =>
          (old || []).filter(task => task.id !== id)
        );

        return { previousTasks };
      },
      onError: (err, id, context: any) => {
        // Revert on error
        if (context?.previousTasks) {
          const queryKey = [...queryKeys.tasks.byUser(currentOrg?.id || '', user?.id || '')];
          queryClient.setQueryData(queryKey, context.previousTasks);
        }
      },
      onSuccess: () => {
        // Refetch to ensure consistency
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.tasks.byUser(currentOrg?.id || '', user?.id || '')]
        });
      },
    }
  );
}

/**
 * Mutation hook for accepting task assignments
 */
export function useAcceptAssignment() {
  const { user, currentOrg } = useAuth();
  const queryClient = useQueryClient();

  return useSupabaseMutation(
    async (taskId: string) => {
      if (!user || !currentOrg) throw new Error('Must be authenticated');

      return await supabase
        .from('task_owners')
        .update({ status: 'confirmed' })
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .eq('organization_id', currentOrg.id);
    },
    {
      onMutate: async (taskId: string) => {
        // Optimistic update
        const queryKey = [...queryKeys.tasks.byUser(currentOrg?.id || '', user?.id || '')];
        await queryClient.cancelQueries({ queryKey });

        const previousTasks = queryClient.getQueryData<Task[]>(queryKey);

        queryClient.setQueryData<Task[]>(queryKey, (old) =>
          (old || []).map(task =>
            task.id === taskId
              ? {
                  ...task,
                  owners: task.owners.map(o =>
                    o.id === user?.id ? { ...o, status: 'confirmed' as const } : o
                  ),
                }
              : task
          )
        );

        return { previousTasks };
      },
      onError: (err, taskId, context: any) => {
        // Revert on error
        if (context?.previousTasks) {
          const queryKey = [...queryKeys.tasks.byUser(currentOrg?.id || '', user?.id || '')];
          queryClient.setQueryData(queryKey, context.previousTasks);
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.tasks.byUser(currentOrg?.id || '', user?.id || '')]
        });
      },
    }
  );
}

/**
 * Mutation hook for rejecting task assignments
 */
export function useRejectAssignment() {
  const { user, currentOrg } = useAuth();
  const queryClient = useQueryClient();

  return useSupabaseMutation(
    async (taskId: string) => {
      if (!user || !currentOrg) throw new Error('Must be authenticated');

      // Delete calendar blocks for this task
      await supabase
        .from('calendar_blocks')
        .delete()
        .eq('task_id', taskId)
        .eq('owner_id', user.id);

      // Delete task_owner record
      return await supabase
        .from('task_owners')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .eq('organization_id', currentOrg.id);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.tasks.byUser(currentOrg?.id || '', user?.id || '')]
        });
      },
    }
  );
}

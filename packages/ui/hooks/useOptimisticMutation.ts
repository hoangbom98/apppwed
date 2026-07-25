// @ts-nocheck
/**
 * useOptimisticMutation.ts — shared-ui/hooks
 * --------------------------------------------
 * Optimistic UI wrapper around @tanstack/react-query's `useMutation`.
 * Updates the cache instantly, then rolls back on error — no extra loading states.
 *
 * Usage:
 *   const { mutate, isLoading } = useOptimisticMutation({
 *     mutationFn: (id: number) => api.delete(`/posts/${id}`),
 *     queryKey:   ['posts'],
 *     // Instant remove from list
 *     onOptimisticUpdate: (old: Post[], id: number) =>
 *       old.filter(p => p.id !== id),
 *   });
 *
 *   <button onClick={() => mutate(post.id)}>Delete</button>
 */

import { useQueryClient, useMutation, UseMutationOptions } from '@tanstack/react-query';

export interface UseOptimisticMutationOptions<TData, TError, TVariables, TContext>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'onMutate' | 'onError' | 'onSettled'> {
  /** The React Query cache key to update optimistically */
  queryKey: readonly unknown[];
  /**
   * Pure function that takes the current cached data and the mutation variables,
   * and returns the new optimistic value.
   * Return `undefined` to skip the optimistic update.
   */
  onOptimisticUpdate: (currentData: any, variables: TVariables) => any;
  /** Called after mutation succeeds (optional, in addition to standard onSuccess) */
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;
  /** Called after rollback on error (optional) */
  onRollback?: (error: TError, variables: TVariables) => void;
}

/**
 * Wraps `useMutation` with automatic optimistic cache updates and rollback.
 * @template TData   Mutation response type
 * @template TError  Error type
 * @template TVariables  Variables passed to mutationFn
 */
export function useOptimisticMutation<TData = unknown, TError = Error, TVariables = void>({
  queryKey,
  onOptimisticUpdate,
  onSuccess,
  onRollback,
  ...mutationOptions
}: UseOptimisticMutationOptions<TData, TError, TVariables, { previousData: unknown }>) {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables, { previousData: unknown }>({
    ...mutationOptions,

    onMutate: async (variables) => {
      // Cancel in-flight refetches to avoid overwriting our optimistic value
      await queryClient.cancelQueries({ queryKey });

      // Snapshot current data for rollback
      const previousData = queryClient.getQueryData(queryKey);

      // Apply optimistic update
      const optimistic = onOptimisticUpdate(previousData, variables);
      if (optimistic !== undefined) {
        queryClient.setQueryData(queryKey, optimistic);
      }

      return { previousData };
    },

    onError: (error, variables, context) => {
      // Roll back to the snapshot
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      onRollback?.(error, variables);
    },

    onSettled: () => {
      // Re-sync with server after settle (success or error)
      queryClient.invalidateQueries({ queryKey });
    },

    onSuccess,
  });
}

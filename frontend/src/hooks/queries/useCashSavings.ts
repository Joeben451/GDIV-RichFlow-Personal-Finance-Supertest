/**
 * Cash Savings TanStack Query Hooks
 * 
 * Provides React Query hooks for managing cash savings
 * with optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashSavingsAPI } from '../../utils/api';

// ============================================================================
// Type Definitions
// ============================================================================

export interface CashSavingsData {
  amount: number;
}

export interface UpdateCashSavingsInput {
  amount: number;
}

// ============================================================================
// Query Keys
// ============================================================================

export const cashSavingsKeys = {
  all: ['cashSavings'] as const,
  detail: () => [...cashSavingsKeys.all, 'detail'] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * Hook to fetch cash savings data
 * 
 * @example
 * ```tsx
 * const { data: cashSavings, isLoading, error } = useCashSavingsQuery();
 * console.log(cashSavings?.amount);
 * ```
 */
export const useCashSavingsQuery = () => {
  return useQuery({
    queryKey: cashSavingsKeys.all,
    queryFn: async () => {
      const response = await cashSavingsAPI.getCashSavings();
      return response;
    },
    select: (data): CashSavingsData => ({
      amount: typeof data?.amount === 'number' ? data.amount : parseFloat(data?.amount ?? '0') || 0,
    }),
  });
};

// ============================================================================
// Mutations
// ============================================================================

/**
 * Hook to update cash savings with optimistic updates
 * 
 * @example
 * ```tsx
 * const updateCashSavings = useUpdateCashSavingsMutation();
 * 
 * updateCashSavings.mutate({
 *   amount: 5000,
 * });
 * ```
 */
export const useUpdateCashSavingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateCashSavingsInput) => {
      const response = await cashSavingsAPI.updateCashSavings(input.amount);
      // API may return { cashSavings: { amount } } or { amount } directly
      const amount = response.cashSavings?.amount ?? response.amount ?? input.amount;
      return { amount } as CashSavingsData;
    },

    onMutate: async (input) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: cashSavingsKeys.all });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<{ amount: number }>(cashSavingsKeys.all);

      // Optimistically update the cache
      queryClient.setQueryData<{ amount: number }>(cashSavingsKeys.all, {
        amount: input.amount,
      });

      // Return context with snapshot for potential rollback
      return { previousData };
    },

    onError: (_error, _input, context) => {
      // Rollback to previous state on error
      if (context?.previousData) {
        queryClient.setQueryData(cashSavingsKeys.all, context.previousData);
      }
    },

    onSettled: () => {
      // Always refetch after mutation to ensure server state sync
      queryClient.invalidateQueries({ queryKey: cashSavingsKeys.all });
    },
  });
};

/**
 * Income TanStack Query Hooks
 * 
 * Replaces the income-related logic from the monolithic useFinancialData hook
 * with modern React Query patterns including optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incomeAPI } from '../../utils/api';

// ============================================================================
// Type Definitions
// ============================================================================

export type IncomeQuadrant = 'EMPLOYEE' | 'SELF_EMPLOYED' | 'BUSINESS_OWNER' | 'INVESTOR';

export type IncomeType = 'Earned' | 'Portfolio' | 'Passive';

export interface IncomeItem {
  id: number;
  name: string;
  amount: number;
  type: IncomeType;
  quadrant: IncomeQuadrant;
}

export interface NormalizedIncome {
  earned: IncomeItem[];
  portfolio: IncomeItem[];
  passive: IncomeItem[];
  all: IncomeItem[];
}

export interface IncomeTotals {
  earned: number;
  portfolio: number;
  passive: number;
  total: number;
  passiveAndPortfolio: number;
}

// Mutation input types
export interface AddIncomeInput {
  name: string;
  amount: number;
  type: IncomeType;
  quadrant?: IncomeQuadrant;
}

export interface UpdateIncomeInput extends AddIncomeInput {
  id: number;
}

export interface DeleteIncomeInput {
  id: number;
  type: IncomeType;
}

// ============================================================================
// Query Keys
// ============================================================================

export const incomeKeys = {
  all: ['income'] as const,
  lists: () => [...incomeKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...incomeKeys.lists(), filters] as const,
  details: () => [...incomeKeys.all, 'detail'] as const,
  detail: (id: number) => [...incomeKeys.details(), id] as const,
};

// ============================================================================
// Helper Functions
// ============================================================================

const typeQuadrantFallback: Record<IncomeType, IncomeQuadrant> = {
  Earned: 'EMPLOYEE',
  Portfolio: 'INVESTOR',
  Passive: 'BUSINESS_OWNER',
};

const normalizeQuadrant = (value: unknown, fallback: IncomeQuadrant): IncomeQuadrant => {
  if (typeof value === 'string') {
    const normalized = value.trim().toUpperCase();
    if (['EMPLOYEE', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'INVESTOR'].includes(normalized)) {
      return normalized as IncomeQuadrant;
    }
  }
  return fallback;
};

const parseIncomeType = (type: string): IncomeType => {
  const upper = type?.toUpperCase();
  if (upper === 'EARNED') return 'Earned';
  if (upper === 'PORTFOLIO') return 'Portfolio';
  if (upper === 'PASSIVE') return 'Passive';
  return 'Earned';
};

const normalizeIncomeItem = (item: Record<string, unknown>): IncomeItem => {
  const type = parseIncomeType(item.type as string);
  return {
    id: item.id as number,
    name: item.name as string,
    amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount as string),
    type,
    quadrant: normalizeQuadrant(item.quadrant, typeQuadrantFallback[type]),
  };
};

/**
 * Normalizes raw API response into categorized income arrays
 */
const normalizeIncomeData = (data: unknown): NormalizedIncome => {
  const incomeLines = Array.isArray(data) ? data : [];
  const all = incomeLines.map(normalizeIncomeItem);
  
  return {
    earned: all.filter((i) => i.type === 'Earned'),
    portfolio: all.filter((i) => i.type === 'Portfolio'),
    passive: all.filter((i) => i.type === 'Passive'),
    all,
  };
};

/**
 * Calculate income totals from normalized data
 */
export const calculateIncomeTotals = (income: NormalizedIncome): IncomeTotals => {
  const earned = income.earned.reduce((sum, i) => sum + i.amount, 0);
  const portfolio = income.portfolio.reduce((sum, i) => sum + i.amount, 0);
  const passive = income.passive.reduce((sum, i) => sum + i.amount, 0);
  
  return {
    earned,
    portfolio,
    passive,
    total: earned + portfolio + passive,
    passiveAndPortfolio: passive + portfolio,
  };
};

// ============================================================================
// Queries
// ============================================================================

/**
 * Hook to fetch and normalize income data
 * 
 * @example
 * ```tsx
 * const { data: income, isLoading, error } = useIncomeQuery();
 * console.log(income?.earned, income?.passive, income?.portfolio);
 * ```
 */
export const useIncomeQuery = () => {
  return useQuery({
    queryKey: incomeKeys.all,
    queryFn: async () => {
      const response = await incomeAPI.getIncomeLines();
      return response;
    },
    select: normalizeIncomeData,
  });
};

/**
 * Hook to get income totals (derived from income query)
 * 
 * @example
 * ```tsx
 * const { data: totals } = useIncomeTotals();
 * console.log(totals?.total, totals?.passiveAndPortfolio);
 * ```
 */
export const useIncomeTotals = () => {
  const { data: income, ...rest } = useIncomeQuery();
  
  return {
    ...rest,
    data: income ? calculateIncomeTotals(income) : undefined,
  };
};

// ============================================================================
// Mutations
// ============================================================================

/**
 * Hook to add a new income item with optimistic updates
 * 
 * @example
 * ```tsx
 * const addIncome = useAddIncomeMutation();
 * 
 * addIncome.mutate({
 *   name: 'Salary',
 *   amount: 5000,
 *   type: 'Earned',
 *   quadrant: 'EMPLOYEE'
 * });
 * ```
 */
export const useAddIncomeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddIncomeInput) => {
      const resolvedQuadrant = input.quadrant || typeQuadrantFallback[input.type];
      const response = await incomeAPI.addIncomeLine(
        input.name,
        input.amount,
        input.type,
        resolvedQuadrant
      );
      // API may return { incomeLine: {...} } or the item directly
      const incomeData = response.incomeLine || response;
      return normalizeIncomeItem(incomeData);
    },

    onMutate: async (newIncome) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: incomeKeys.all });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<unknown[]>(incomeKeys.all);

      // Optimistically update the cache
      queryClient.setQueryData<unknown[]>(incomeKeys.all, (old) => {
        const oldArray = Array.isArray(old) ? old : [];
        
        // Create optimistic item with temporary negative ID
        const optimisticItem = {
          id: -Date.now(), // Temporary ID (will be replaced on success)
          name: newIncome.name,
          amount: newIncome.amount,
          type: newIncome.type,
          quadrant: newIncome.quadrant || typeQuadrantFallback[newIncome.type],
        };
        
        return [...oldArray, optimisticItem];
      });

      // Return context with snapshot for potential rollback
      return { previousData };
    },

    onError: (_error, _newIncome, context) => {
      // Rollback to previous state on error
      if (context?.previousData) {
        queryClient.setQueryData(incomeKeys.all, context.previousData);
      }
    },

    onSettled: () => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: incomeKeys.all });
    },
  });
};

/**
 * Hook to update an existing income item with optimistic updates
 * 
 * @example
 * ```tsx
 * const updateIncome = useUpdateIncomeMutation();
 * 
 * updateIncome.mutate({
 *   id: 1,
 *   name: 'Updated Salary',
 *   amount: 5500,
 *   type: 'Earned',
 *   quadrant: 'EMPLOYEE'
 * });
 * ```
 */
export const useUpdateIncomeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateIncomeInput) => {
      const resolvedQuadrant = input.quadrant || typeQuadrantFallback[input.type];
      const response = await incomeAPI.updateIncomeLine(
        input.id,
        input.name,
        input.amount,
        input.type,
        resolvedQuadrant
      );
      const incomeData = response.incomeLine || response;
      return normalizeIncomeItem(incomeData);
    },

    onMutate: async (updatedIncome) => {
      await queryClient.cancelQueries({ queryKey: incomeKeys.all });

      const previousData = queryClient.getQueryData<unknown[]>(incomeKeys.all);

      queryClient.setQueryData<unknown[]>(incomeKeys.all, (old) => {
        const oldArray = Array.isArray(old) ? old : [];
        
        return oldArray.map((item: any) => {
          if (item.id === updatedIncome.id) {
            return {
              ...item,
              name: updatedIncome.name,
              amount: updatedIncome.amount,
              type: updatedIncome.type,
              quadrant: updatedIncome.quadrant || typeQuadrantFallback[updatedIncome.type],
            };
          }
          return item;
        });
      });

      return { previousData };
    },

    onError: (_error, _updatedIncome, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(incomeKeys.all, context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.all });
    },
  });
};

/**
 * Hook to delete an income item with optimistic updates
 * 
 * @example
 * ```tsx
 * const deleteIncome = useDeleteIncomeMutation();
 * 
 * deleteIncome.mutate({ id: 1, type: 'Earned' });
 * ```
 */
export const useDeleteIncomeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteIncomeInput) => {
      await incomeAPI.deleteIncomeLine(input.id);
      return input;
    },

    onMutate: async (deletedIncome) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: incomeKeys.all });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<unknown[]>(incomeKeys.all);

      // Optimistically remove from cache
      queryClient.setQueryData<unknown[]>(incomeKeys.all, (old) => {
        const oldArray = Array.isArray(old) ? old : [];
        return oldArray.filter((item: any) => item.id !== deletedIncome.id);
      });

      // Return context with snapshot for potential rollback
      return { previousData };
    },

    onError: (_error, _deletedIncome, context) => {
      // Rollback to previous state on error
      if (context?.previousData) {
        queryClient.setQueryData(incomeKeys.all, context.previousData);
      }
    },

    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: incomeKeys.all });
    },
  });
};

// ============================================================================
// Prefetch Helper
// ============================================================================

/**
 * Prefetch income data (useful for route preloading)
 * 
 * @example
 * ```tsx
 * const queryClient = useQueryClient();
 * 
 * // On hover or before navigation
 * prefetchIncome(queryClient);
 * ```
 */
export const prefetchIncome = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await queryClient.prefetchQuery({
    queryKey: incomeKeys.all,
    queryFn: () => incomeAPI.getIncomeLines(),
  });
};

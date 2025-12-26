/**
 * Activity Feed TanStack Query Hook
 * 
 * Fetches recent financial events for the "Time Machine" activity feed.
 */

import { useQuery } from '@tanstack/react-query';
import { eventLogsAPI } from '../../utils/api';

// ============================================================================
// Type Definitions
// ============================================================================

export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE';

export type EntityType = 
  | 'INCOME' 
  | 'EXPENSE' 
  | 'ASSET' 
  | 'LIABILITY' 
  | 'CASH_SAVINGS' 
  | 'USER';

export interface EventData {
  name?: string;
  amount?: number;
  value?: number;
  type?: string;
  [key: string]: unknown;
}

export interface ActivityEvent {
  id: number;
  timestamp: string;
  actionType: ActionType;
  entityType: EntityType;
  entitySubtype: string | null;
  beforeValue: EventData | null;
  afterValue: EventData | null;
  userId: number;
  entityId: number;
}

export interface ActivityFeedData {
  events: ActivityEvent[];
  total: number;
}

// ============================================================================
// Query Keys
// ============================================================================

export const activityFeedKeys = {
  all: ['recent-events'] as const,
  list: (limit: number) => [...activityFeedKeys.all, 'list', limit] as const,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats a timestamp into a relative time string (e.g., "2 hours ago")
 */
export const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const eventTime = new Date(timestamp);
  const diffMs = now.getTime() - eventTime.getTime();
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) {
    return 'just now';
  } else if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (days < 7) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else if (weeks < 4) {
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
};

/**
 * Maps action type to a human-readable verb
 */
const getActionVerb = (actionType: ActionType): string => {
  switch (actionType) {
    case 'CREATE':
      return 'Added';
    case 'UPDATE':
      return 'Updated';
    case 'DELETE':
      return 'Deleted';
    default:
      return 'Modified';
  }
};

/**
 * Maps entity type to a human-readable label
 */
const getEntityLabel = (entityType: EntityType, entitySubtype?: string | null): string => {
  switch (entityType) {
    case 'INCOME':
      if (entitySubtype) {
        const subtypeMap: Record<string, string> = {
          'EARNED': 'Earned Income',
          'PORTFOLIO': 'Portfolio Income',
          'PASSIVE': 'Passive Income',
        };
        return subtypeMap[entitySubtype] || 'Income';
      }
      return 'Income';
    case 'EXPENSE':
      return 'Expense';
    case 'ASSET':
      return 'Asset';
    case 'LIABILITY':
      return 'Liability';
    case 'CASH_SAVINGS':
      return 'Cash Savings';
    case 'USER':
      return 'Profile';
    default:
      return 'Item';
  }
};

/**
 * Gets the icon for an entity type
 */
export const getEntityIcon = (entityType: EntityType): string => {
  switch (entityType) {
    case 'INCOME':
      return '💰';
    case 'EXPENSE':
      return '💸';
    case 'ASSET':
      return '🏠';
    case 'LIABILITY':
      return '💳';
    case 'CASH_SAVINGS':
      return '🏦';
    case 'USER':
      return '👤';
    default:
      return '📝';
  }
};

/**
 * Gets a color class for an action type
 */
export const getActionColor = (actionType: ActionType): string => {
  switch (actionType) {
    case 'CREATE':
      return 'text-green-400';
    case 'UPDATE':
      return 'text-yellow-400';
    case 'DELETE':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

/**
 * Generates a human-readable description of an event
 */
export const formatEventDescription = (event: ActivityEvent): string => {
  const action = getActionVerb(event.actionType);
  const entityLabel = getEntityLabel(event.entityType, event.entitySubtype);
  
  // Get the name from afterValue (for create/update) or beforeValue (for delete)
  const data = event.actionType === 'DELETE' ? event.beforeValue : event.afterValue;
  const name = data?.name;
  
  if (name) {
    return `${action} ${entityLabel}: ${name}`;
  }
  
  // For cash savings, show amount change
  if (event.entityType === 'CASH_SAVINGS') {
    const amount = data?.amount;
    if (amount !== undefined) {
      return `${action} ${entityLabel}`;
    }
  }
  
  return `${action} ${entityLabel}`;
};

/**
 * Normalizes API response to ActivityEvent array
 */
const normalizeEvents = (response: unknown): ActivityEvent[] => {
  // Handle various response shapes
  if (Array.isArray(response)) {
    return response as ActivityEvent[];
  }
  
  if (response && typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.events)) {
      return obj.events as ActivityEvent[];
    }
    if (Array.isArray(obj.data)) {
      return obj.data as ActivityEvent[];
    }
  }
  
  return [];
};

// ============================================================================
// Query Hook
// ============================================================================

/**
 * Hook to fetch recent activity events
 * 
 * @param limit - Number of events to fetch (default: 10)
 * 
 * @example
 * ```tsx
 * const { data: events, isLoading } = useActivityFeed(5);
 * ```
 */
export const useActivityFeed = (limit: number = 10) => {
  return useQuery({
    queryKey: activityFeedKeys.list(limit),
    queryFn: async () => {
      const response = await eventLogsAPI.getEvents({ limit });
      return normalizeEvents(response);
    },
    // Refetch every 30 seconds to keep feed fresh
    refetchInterval: 30000,
    // Keep previous data while refetching
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook to fetch activity feed with pagination
 */
export const useActivityFeedPaginated = (params: {
  limit?: number;
  offset?: number;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: [...activityFeedKeys.all, 'paginated', params],
    queryFn: async () => {
      const response = await eventLogsAPI.getEvents(params);
      return normalizeEvents(response);
    },
  });
};

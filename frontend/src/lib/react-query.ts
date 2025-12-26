import { QueryClient } from '@tanstack/react-query';

// Create a QueryClient instance with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Only retry failed requests once
      retry: 1,
      // Refetch on window focus for better UX
      refetchOnWindowFocus: true,
    },
    mutations: {
      // Only retry mutations once
      retry: 1,
    },
  },
});

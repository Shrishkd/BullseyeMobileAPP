import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Do not retry auth/validation errors; retry flaky network once.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 1;
      },
    },
    mutations: { retry: false },
  },
});

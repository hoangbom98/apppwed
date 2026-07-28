// __APPNAME__/src/types/index.ts
// Shared TypeScript types for this SPA.

/** Standard API envelope returned by the backend */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data:    T;
  message?: string;
  error?: {
    code:    string;
    message: string;
  };
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  data:  T[];
  total: number;
  page:  number;
  limit: number;
}

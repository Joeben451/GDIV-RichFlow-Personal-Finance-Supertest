import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAccessToken, refreshAccessToken, clearAccessToken } from '../utils/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Error class for API errors with status code
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Request options extending standard fetch options
interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | unknown[] | FormData;
}

// Response type wrapper
interface ApiResponse<T> {
  data: T;
  status: number;
}

/**
 * Custom hook that provides an authenticated API client.
 * 
 * Features:
 * - Automatically injects Authorization header using stored access token
 * - Handles 401 errors by attempting token refresh
 * - Triggers logout if refresh fails
 * - Returns typed promises
 * 
 * @returns Object with request methods (get, post, put, patch, delete)
 */
export const useApiClient = () => {
  const { logout } = useAuth();

  /**
   * Core fetch wrapper with authentication handling
   */
  const request = useCallback(async <T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> => {
    const { body, headers: customHeaders, ...restOptions } = options;

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(customHeaders as Record<string, string>),
    };

    // Add Authorization header if we have a token
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      ...restOptions,
      headers,
      credentials: 'include', // Include cookies for refresh token
    };

    // Add body if provided
    if (body) {
      if (body instanceof FormData) {
        // Remove Content-Type header for FormData (browser will set it with boundary)
        delete headers['Content-Type'];
        fetchOptions.body = body;
      } else {
        fetchOptions.body = JSON.stringify(body);
      }
    }

    // Make the request
    let response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

    // Handle 401 Unauthorized - attempt token refresh
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      
      if (refreshed) {
        // Retry the request with the new token
        const newToken = getAccessToken();
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
        }
        
        // Rebuild fetch options with new headers
        const retryOptions: RequestInit = {
          ...restOptions,
          headers,
          credentials: 'include',
        };
        
        if (body) {
          if (body instanceof FormData) {
            delete headers['Content-Type'];
            retryOptions.body = body;
          } else {
            retryOptions.body = JSON.stringify(body);
          }
        }
        
        response = await fetch(`${API_BASE_URL}${endpoint}`, retryOptions);
      } else {
        // Refresh failed - clear token and logout
        clearAccessToken();
        await logout();
        throw new ApiError('Session expired. Please login again.', 401);
      }
    }

    // Parse response
    let data: T;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      // Handle non-JSON responses
      data = (await response.text()) as unknown as T;
    }

    // Handle error responses
    if (!response.ok) {
      const errorMessage = typeof data === 'object' && data !== null && 'error' in data
        ? (data as { error: string }).error
        : `Request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status);
    }

    return data;
  }, [logout]);

  /**
   * GET request
   */
  const get = useCallback(<T = unknown>(
    endpoint: string,
    options?: Omit<ApiRequestOptions, 'body' | 'method'>
  ): Promise<T> => {
    return request<T>(endpoint, { ...options, method: 'GET' });
  }, [request]);

  /**
   * POST request
   */
  const post = useCallback(<T = unknown>(
    endpoint: string,
    body?: Record<string, unknown> | unknown[],
    options?: Omit<ApiRequestOptions, 'body' | 'method'>
  ): Promise<T> => {
    return request<T>(endpoint, { ...options, method: 'POST', body });
  }, [request]);

  /**
   * PUT request
   */
  const put = useCallback(<T = unknown>(
    endpoint: string,
    body?: Record<string, unknown> | unknown[],
    options?: Omit<ApiRequestOptions, 'body' | 'method'>
  ): Promise<T> => {
    return request<T>(endpoint, { ...options, method: 'PUT', body });
  }, [request]);

  /**
   * PATCH request
   */
  const patch = useCallback(<T = unknown>(
    endpoint: string,
    body?: Record<string, unknown> | unknown[],
    options?: Omit<ApiRequestOptions, 'body' | 'method'>
  ): Promise<T> => {
    return request<T>(endpoint, { ...options, method: 'PATCH', body });
  }, [request]);

  /**
   * DELETE request
   */
  const del = useCallback(<T = unknown>(
    endpoint: string,
    options?: Omit<ApiRequestOptions, 'method'>
  ): Promise<T> => {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  }, [request]);

  return {
    request,
    get,
    post,
    put,
    patch,
    delete: del,
  };
};

/**
 * Type helper for extracting data from API responses
 */
export type ExtractApiData<T> = T extends ApiResponse<infer D> ? D : T;

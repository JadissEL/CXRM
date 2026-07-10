'use client';

import { useState, useCallback } from 'react';
import { AsyncState, ApiResponse } from '@/types';
import { api } from '@/services/api';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  autoExecute?: boolean;
}

export function useApi<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  options: UseApiOptions = {}
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (data?: any, params?: Record<string, any>) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        let response: ApiResponse<T>;

        switch (method) {
          case 'GET':
            response = await api.get<T>(endpoint, params);
            break;
          case 'POST':
            response = await api.post<T>(endpoint, data);
            break;
          case 'PUT':
            response = await api.put<T>(endpoint, data);
            break;
          case 'PATCH':
            response = await api.patch<T>(endpoint, data);
            break;
          case 'DELETE':
            response = await api.delete<T>(endpoint);
            break;
          default:
            throw new Error(`Unsupported HTTP method: ${method}`);
        }

        if (response.success && response.data) {
          setState({
            data: response.data,
            loading: false,
            error: null,
          });
          options?.onSuccess?.(response.data);
          return response.data;
        } else {
          const error = response.error || 'Request failed';
          setState({
            data: null,
            loading: false,
            error,
          });
          options?.onError?.(error);
          throw new Error(error);
        }
              } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An error occurred';
          setState({
            data: null,
            loading: false,
            error: errorMessage,
          });
          options?.onError?.(errorMessage);
          throw error;
        }
    },
    [endpoint, method, options]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Specialized hooks for common operations
export function useGet<T = any>(endpoint: string, options?: UseApiOptions) {
  return useApi<T>(endpoint, 'GET', options);
}

export function usePost<T = any>(endpoint: string, options?: UseApiOptions) {
  return useApi<T>(endpoint, 'POST', options);
}

export function usePut<T = any>(endpoint: string, options?: UseApiOptions) {
  return useApi<T>(endpoint, 'PUT', options);
}

export function usePatch<T = any>(endpoint: string, options?: UseApiOptions) {
  return useApi<T>(endpoint, 'PATCH', options);
}

export function useDelete<T = any>(endpoint: string, options?: UseApiOptions) {
  return useApi<T>(endpoint, 'DELETE', options);
}

// Hook for file uploads
export function useFileUpload<T = any>(endpoint: string, options?: UseApiOptions) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const upload = useCallback(
    async (file: File, onProgress?: (progress: number) => void) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await api.upload<T>(endpoint, file, onProgress);

        if (response.success && response.data) {
          setState({
            data: response.data,
            loading: false,
            error: null,
          });
          options?.onSuccess?.(response.data);
          return response.data;
        } else {
          const error = response.error || 'Upload failed';
          setState({
            data: null,
            loading: false,
            error,
          });
          options?.onError?.(error);
          throw new Error(error);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });
        options?.onError?.(errorMessage);
        throw error;
      }
    },
    [endpoint, options]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    upload,
    reset,
  };
} 
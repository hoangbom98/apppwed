// @ts-nocheck
import { useState, useCallback } from 'react';
import api from '../api/client';

/**
 * useApi — generic API call hook with loading/error state
 * Usage:
 *   const { data, loading, error, execute } = useApi();
 *   execute(() => api.get('/endpoint'), { onSuccess: (data) => ... });
 */
export function useApi(config = {}) {
  const [data, setData]       = useState(config.initialData ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const execute = useCallback(async (apiCall, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      const payload = result?.data ?? result;
      setData(payload);
      if (options.onSuccess) options.onSuccess(payload);
      return payload;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Lỗi không xác định';
      setError(msg);
      if (options.onError) options.onError(msg, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(config.initialData ?? null);
    setError(null);
    setLoading(false);
  }, [config.initialData]);

  return { data, loading, error, execute, reset, setData };
}

export default useApi;

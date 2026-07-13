import { useState, useEffect, useCallback } from 'react';

/**
 * useFetch Hook
 * Standardizes async operations, tracking loading states and error boundaries.
 */
function useFetch(fetchFn, immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (immediate) {
      execute().catch((err) => console.error('useFetch immediate execution failed:', err));
    }
  }, [immediate, execute]);

  return { data, loading, error, execute, setData };
}

export default useFetch;

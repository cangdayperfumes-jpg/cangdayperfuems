'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to prevent hydration mismatch with Zustand persist
 * Returns undefined during SSR and the actual value after client hydration
 */
export function useStore<T, F>(
  store: (callback: (state: T) => unknown) => unknown,
  callback: (state: T) => F,
) {
  const result = store(callback) as F;
  const [data, setData] = useState<F>();

  useEffect(() => {
    setData(result);
  }, [result]);

  return data;
}

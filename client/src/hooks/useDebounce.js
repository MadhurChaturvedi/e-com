import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * Delays updating the debounced value until after the specified delay
 * has elapsed since the last time the value was changed.
 * Prevents high-frequency API calls on every keystroke.
 *
 * @param {any} value - The input value to debounce
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @returns {any} debouncedValue
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;

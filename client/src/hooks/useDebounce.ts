import { useEffect, useState } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms of no changes.
 *
 * Why: a search box shouldn't fire an API request on every keystroke. Debouncing waits until
 * the user pauses, collapsing a burst of edits into one request. Classic performance hygiene.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // cancel the pending update if value changes again
  }, [value, delay]);

  return debounced;
}

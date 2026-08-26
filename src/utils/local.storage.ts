import { useState, useEffect } from "react";

/**
 * Store react state in localStorage so they persist across page reloads.
 * @param key - the localStorage key.
 * @param initialValue - the default value used if no stored value exists.
 * @returns state variable corresponding to the specified key with its setter function.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue === null) return initialValue;

      const parsed = JSON.parse(storedValue);

      if (
        typeof initialValue === "object" &&
        initialValue !== null &&
        !Array.isArray(initialValue) &&
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        return { ...initialValue, ...parsed };
      }

      return parsed;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

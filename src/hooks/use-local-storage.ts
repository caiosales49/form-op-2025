"use client";

import { useState, useEffect, useCallback } from "react";

function getStorageValue<T>(key: string, defaultValue: T): T {
  // getting stored value
  if (typeof window === "undefined") {
    return defaultValue;
  }
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key “${key}”:`, error);
    return defaultValue;
  }
}

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => getStorageValue(key, defaultValue));

  const setStoredValue = useCallback((newValue: T | ((val: T) => T)) => {
    setValue((currentValue) => {
      const valueToStore = newValue instanceof Function ? newValue(currentValue) : newValue;
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
      return valueToStore;
    });
  }, [key]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Error parsing storage change for key “${key}”:`, error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);


  return [value, setStoredValue];
}

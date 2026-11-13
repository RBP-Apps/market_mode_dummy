// src/hooks/useLocalStorage.js
// Custom React hook for subscribing to LocalStorage data reactively

import { useState, useEffect, useCallback } from "react";
import { getItem, setItem, subscribeToStorage } from "../lib/storage.js";

export function useLocalStorage(table, initialValue = []) {
  const [data, setData] = useState(() => getItem(table, initialValue));

  useEffect(() => {
    // Initial fetch
    setData(getItem(table, initialValue));

    // Subscribe to changes from any component or tab
    const unsubscribe = subscribeToStorage((detail) => {
      if (detail.table === table) {
        setData(getItem(table, initialValue));
      }
    });

    return () => unsubscribe();
  }, [table]);

  const updateData = useCallback(
    (newValueOrFn) => {
      setData((prev) => {
        const valueToStore =
          typeof newValueOrFn === "function" ? newValueOrFn(prev) : newValueOrFn;
        setItem(table, valueToStore);
        return valueToStore;
      });
    },
    [table]
  );

  return [data, updateData];
}

export default useLocalStorage;


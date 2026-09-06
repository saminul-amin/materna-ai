"use client";

import { useEffect, useState } from "react";

/**
 * Reads a URL query parameter on the client without `useSearchParams`, so pages do not need a
 * Suspense boundary (which can leave the page in its fallback state in some dev-server scenarios).
 * Returns `undefined` until mounted, then the value (or null when absent).
 */
export function useQueryParam(key: string): string | null | undefined {
  const [value, setValue] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    try {
      setValue(new URLSearchParams(window.location.search).get(key));
    } catch {
      setValue(null);
    }
  }, [key]);
  return value;
}

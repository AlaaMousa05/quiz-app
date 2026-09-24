import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "offline";

const DEFAULT_RETRY_DELAY_MS = 3000;

export interface UseAutosaveResult<T> {
  status: AutosaveStatus;
  save: (value: T) => void;
}

// Fires `saveFn` on every call to `save`; shows saving/saved/offline states
// and retries automatically after `retryDelayMs` on failure (ui.md §S4's
// autosave indicator). Only the most recently requested value ever lands as
// "saved" — an in-flight save that resolves after a newer one was queued is
// discarded rather than downgrading the status.
export function useAutosave<T>(saveFn: (value: T) => Promise<unknown>, retryDelayMs = DEFAULT_RETRY_DELAY_MS): UseAutosaveResult<T> {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const pendingValueRef = useRef<T | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const attempt = useCallback(
    async (value: T) => {
      pendingValueRef.current = value;
      setStatus("saving");
      try {
        await saveFn(value);
        if (pendingValueRef.current === value) {
          setStatus("saved");
        }
      } catch {
        if (pendingValueRef.current !== value) return;
        setStatus("offline");
        retryTimeoutRef.current = setTimeout(() => {
          if (pendingValueRef.current !== null) void attempt(pendingValueRef.current);
        }, retryDelayMs);
      }
    },
    [saveFn, retryDelayMs],
  );

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  const save = useCallback(
    (value: T) => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      void attempt(value);
    },
    [attempt],
  );

  return { status, save };
}

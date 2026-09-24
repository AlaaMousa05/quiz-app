import { useEffect, useRef, useState } from "react";

export interface UseQuizTimerResult {
  remainingSeconds: number;
  isExpired: boolean;
}

// Counts down locally from the server's remainingSeconds, ticking every
// second, floored at 0. Never extends: a later render with a *larger*
// server value (e.g. a stale resync) is ignored — only a smaller value
// (a genuine resume with less time left) is adopted (ui.md §S4, FR-008).
export function useQuizTimer(serverRemainingSeconds: number): UseQuizTimerResult {
  const [remainingSeconds, setRemainingSeconds] = useState(serverRemainingSeconds);
  const appliedServerValueRef = useRef(serverRemainingSeconds);

  useEffect(() => {
    if (serverRemainingSeconds !== appliedServerValueRef.current && serverRemainingSeconds < remainingSeconds) {
      appliedServerValueRef.current = serverRemainingSeconds;
      setRemainingSeconds(serverRemainingSeconds);
    }
  }, [serverRemainingSeconds, remainingSeconds]);

  useEffect(() => {
    const id = setInterval(() => {
      setRemainingSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return { remainingSeconds, isExpired: remainingSeconds <= 0 };
}

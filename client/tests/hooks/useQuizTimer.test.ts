import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useQuizTimer } from "../../src/features/student-quiz/hooks/useQuizTimer";

describe("useQuizTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts at the server-provided remaining time", () => {
    const { result } = renderHook(() => useQuizTimer(600));
    expect(result.current.remainingSeconds).toBe(600);
    expect(result.current.isExpired).toBe(false);
  });

  it("counts down from the server's remainingSeconds", () => {
    const { result } = renderHook(() => useQuizTimer(600));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.remainingSeconds).toBe(599);
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.remainingSeconds).toBe(594);
  });

  it("stops at 0 and never goes negative", () => {
    const { result } = renderHook(() => useQuizTimer(2));
    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.isExpired).toBe(true);
  });

  it("never extends: a re-render with a larger server value than the current countdown is ignored", () => {
    const { result, rerender } = renderHook(({ seconds }) => useQuizTimer(seconds), {
      initialProps: { seconds: 100 },
    });
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.remainingSeconds).toBe(95);

    // A stale/larger resync value must not push the countdown back up.
    rerender({ seconds: 200 });
    expect(result.current.remainingSeconds).toBe(95);
  });

  it("adopts a smaller server value (a genuine resume with less time left)", () => {
    const { result, rerender } = renderHook(({ seconds }) => useQuizTimer(seconds), {
      initialProps: { seconds: 100 },
    });
    rerender({ seconds: 40 });
    expect(result.current.remainingSeconds).toBe(40);
  });
});

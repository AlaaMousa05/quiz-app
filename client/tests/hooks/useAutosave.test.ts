import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutosave } from "../../src/features/student-quiz/hooks/useAutosave";

describe("useAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts idle", () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutosave(saveFn));
    expect(result.current.status).toBe("idle");
  });

  it("shows saving then saved on a successful save", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutosave(saveFn));

    act(() => result.current.save("answer-1"));
    expect(result.current.status).toBe("saving");

    await vi.waitFor(() => expect(result.current.status).toBe("saved"));
    expect(saveFn).toHaveBeenCalledWith("answer-1");
  });

  it("shows offline when the save fails", async () => {
    const saveFn = vi.fn().mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() => useAutosave(saveFn, 5000));

    act(() => result.current.save("answer-1"));
    await vi.waitFor(() => expect(result.current.status).toBe("offline"));
  });

  it("retries automatically after the retry delay and recovers to saved", async () => {
    const saveFn = vi.fn().mockRejectedValueOnce(new Error("network down")).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAutosave(saveFn, 1000));

    act(() => result.current.save("answer-1"));
    await vi.waitFor(() => expect(result.current.status).toBe("offline"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    await vi.waitFor(() => expect(result.current.status).toBe("saved"));
    expect(saveFn).toHaveBeenCalledTimes(2);
  });

  it("only the latest save wins when called again before the previous one resolves", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutosave(saveFn));

    act(() => {
      result.current.save("answer-1");
      result.current.save("answer-2");
    });

    await vi.waitFor(() => expect(result.current.status).toBe("saved"));
    expect(saveFn).toHaveBeenLastCalledWith("answer-2");
  });
});

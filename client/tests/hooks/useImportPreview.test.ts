import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useImportPreview } from "../../src/features/quiz-editor/hooks/useImportPreview";

const fakePreview = { rows: [{ rowNumber: 1, questionText: "Q1", points: 10, options: [], status: "OK" as const }], summary: { total: 1, willImport: 1 } };

function fakeFile(name = "quiz.csv") {
  return new File(["irrelevant"], name, { type: "text/csv" });
}

describe("useImportPreview", () => {
  it("starts idle with no preview", () => {
    const previewFn = vi.fn();
    const { result } = renderHook(() => useImportPreview(previewFn));
    expect(result.current.status).toBe("idle");
    expect(result.current.preview).toBeNull();
  });

  it("shows loading then success with the parsed preview", async () => {
    const previewFn = vi.fn().mockResolvedValue(fakePreview);
    const { result } = renderHook(() => useImportPreview(previewFn));

    let selectPromise!: Promise<void>;
    act(() => {
      selectPromise = result.current.selectFile(fakeFile());
    });
    expect(result.current.status).toBe("loading");

    await act(async () => {
      await selectPromise;
    });

    expect(result.current.status).toBe("success");
    expect(result.current.preview).toEqual(fakePreview);
    expect(previewFn).toHaveBeenCalledWith(expect.any(File));
  });

  it("shows an error message when the preview request fails", async () => {
    const previewFn = vi.fn().mockRejectedValue(new Error("Save as CSV UTF-8 or upload XLSX"));
    const { result } = renderHook(() => useImportPreview(previewFn));

    await act(async () => {
      await result.current.selectFile(fakeFile());
    });

    expect(result.current.status).toBe("error");
    expect(result.current.errorMessage).toBe("Save as CSV UTF-8 or upload XLSX");
    expect(result.current.preview).toBeNull();
  });

  it("selecting a new file after an error resets to loading, not stuck in error", async () => {
    const previewFn = vi.fn().mockRejectedValueOnce(new Error("bad file")).mockResolvedValueOnce(fakePreview);
    const { result } = renderHook(() => useImportPreview(previewFn));

    await act(async () => {
      await result.current.selectFile(fakeFile("bad.csv"));
    });
    expect(result.current.status).toBe("error");

    await act(async () => {
      await result.current.selectFile(fakeFile("good.csv"));
    });
    expect(result.current.status).toBe("success");
    expect(result.current.preview).toEqual(fakePreview);
  });
});

import { useCallback, useState } from "react";
import type { QuizImportPreview } from "shared";

export type ImportPreviewStatus = "idle" | "loading" | "success" | "error";

export interface UseImportPreviewResult {
  status: ImportPreviewStatus;
  preview: QuizImportPreview | null;
  errorMessage: string | null;
  selectFile: (file: File) => Promise<void>;
}

// previewFn is injected (mirrors useAutosave's saveFn) so it's testable
// without a real network call — the real implementation posts the file as
// multipart/form-data to POST /api/imports/quiz/preview.
export function useImportPreview(previewFn: (file: File) => Promise<QuizImportPreview>): UseImportPreviewResult {
  const [status, setStatus] = useState<ImportPreviewStatus>("idle");
  const [preview, setPreview] = useState<QuizImportPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectFile = useCallback(
    async (file: File) => {
      setStatus("loading");
      setErrorMessage(null);
      try {
        const result = await previewFn(file);
        setPreview(result);
        setStatus("success");
      } catch (err) {
        setPreview(null);
        setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        setStatus("error");
      }
    },
    [previewFn],
  );

  return { status, preview, errorMessage, selectFile };
}

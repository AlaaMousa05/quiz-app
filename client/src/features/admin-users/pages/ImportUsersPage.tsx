import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { Button } from "../../../components/ui/Button";
import { LinkButton } from "../../../components/ui/LinkButton";
import { useImportPreview } from "../../../lib/useImportPreview";
import { previewImportFile, confirmImportFile, type ImportTarget } from "../api/importApi";
import { adminUsersKey } from "../api/queryKeys";
import { ImportPreviewList } from "../components/ImportPreviewList";
import { CredentialsTable } from "../components/CredentialsTable";
import type { ImportConfirmResult } from "../api/types";

export function ImportUsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<ImportTarget>("students");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportConfirmResult | null>(null);
  const importPreview = useImportPreview((f) => previewImportFile(target, f));

  const confirmImport = useMutation({
    // The confirm button only renders once a successful preview exists, and
    // a preview can't succeed without `file` being set.
    mutationFn: () => confirmImportFile(target, file!),
    onSuccess: (r) => {
      void queryClient.invalidateQueries({ queryKey: adminUsersKey() });
      setResult(r);
    },
  });

  function handleTargetChange(next: ImportTarget) {
    setTarget(next);
    setFile(null);
  }

  function handleFileChange(selected: File | null) {
    setFile(selected);
    if (selected) void importPreview.selectFile(selected);
  }

  if (result) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 p-4">
        <h1 className="text-xl font-semibold" dir="auto">
          {t("admin.import.resultHeading", { count: result.created.length })}
        </h1>
        <CredentialsTable accounts={result.created} />
        <div className="flex gap-2">
          <Button onClick={() => window.print()}>{t("admin.import.print")}</Button>
          <Button variant="primary" onClick={() => navigate("/admin/users")}>
            {t("admin.import.done")}
          </Button>
        </div>
      </main>
    );
  }

  const errorCount = importPreview.preview ? importPreview.preview.summary.total - importPreview.preview.summary.willImport : 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 p-4">
      <LinkButton to="/admin/users">{t("common.back")}</LinkButton>
      <h1 className="text-xl font-semibold" dir="auto">
        {target === "students" ? t("admin.import.studentsTitle") : t("admin.import.teachersTitle")}
      </h1>

      <div className="flex gap-2">
        <Button variant={target === "students" ? "primary" : "secondary"} onClick={() => handleTargetChange("students")}>
          {t("admin.import.studentsTitle")}
        </Button>
        <Button variant={target === "teachers" ? "primary" : "secondary"} onClick={() => handleTargetChange("teachers")}>
          {t("admin.import.teachersTitle")}
        </Button>
      </div>

      <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-500">
        {t("admin.import.dropzone")}
        <input
          key={target}
          type="file"
          accept=".csv,.xlsx"
          className="sr-only"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
      </label>

      {importPreview.status === "loading" && <CenteredMessage>{t("common.loading")}</CenteredMessage>}
      {importPreview.status === "error" && (
        <p role="alert" className="text-sm text-danger-700" dir="auto">
          {importPreview.errorMessage ?? t("admin.import.error")}
        </p>
      )}

      {importPreview.status === "success" && importPreview.preview && file && (
        <>
          <h2 className="font-medium" dir="auto">
            {t("admin.import.previewHeading", { fileName: file.name, count: importPreview.preview.summary.total })}
          </h2>
          <ImportPreviewList preview={importPreview.preview} />
          <p className="text-sm text-neutral-500" dir="auto">
            {t("admin.import.summary", {
              willImport: importPreview.preview.summary.willImport,
              total: importPreview.preview.summary.total,
              errors: errorCount,
            })}
          </p>

          {importPreview.preview.summary.willImport > 0 && (
            <Button variant="primary" disabled={confirmImport.isPending} onClick={() => confirmImport.mutate()}>
              {t("admin.import.confirm", { count: importPreview.preview.summary.willImport })}
            </Button>
          )}
        </>
      )}
    </main>
  );
}

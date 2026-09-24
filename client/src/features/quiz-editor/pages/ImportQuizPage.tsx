import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { AppShell } from "../../../components/ui/AppShell";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { useToast } from "../../../components/ui/Toast";
import { errorMessage } from "../../../lib/errorMessage";
import { useTeacherClasses } from "../api/useTeacherClasses";
import { useImportPreview } from "../../../lib/useImportPreview";
import { previewQuizImportFile, confirmQuizImportFile } from "../api/importApi";
import { teacherQuizzesKey } from "../api/queryKeys";
import { ImportPreviewTable } from "../components/ImportPreviewTable";
import { QuizSettingsForm, type QuizSettingsFormValues } from "../components/QuizSettingsForm";

export function ImportQuizPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const classesQuery = useTeacherClasses();
  const importPreview = useImportPreview(previewQuizImportFile);
  const [file, setFile] = useState<File | null>(null);

  const confirmImport = useMutation({
    // The settings form (which calls this) only renders once a successful
    // preview exists, and a preview can't succeed without `file` being set.
    mutationFn: (values: QuizSettingsFormValues) => confirmQuizImportFile(file!, values),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: teacherQuizzesKey() });
      toast.show(t("toast.created"));
      navigate(`/teacher/quizzes/${result.quizId}/questions`);
    },
  });

  function handleFileChange(selected: File | null) {
    setFile(selected);
    if (selected) void importPreview.selectFile(selected);
  }

  if (classesQuery.isLoading) return <AppShell><CenteredMessage>{t("common.loading")}</CenteredMessage></AppShell>;
  if (classesQuery.isError || !classesQuery.data) return <AppShell><CenteredMessage>{t("quizEditor.loadError")}</CenteredMessage></AppShell>;

  const errorCount = importPreview.preview ? importPreview.preview.summary.total - importPreview.preview.summary.willImport : 0;

  return (
    <AppShell title={t("quizEditor.import.title")}>
      <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-neutral-300 bg-white p-4 text-center text-sm text-neutral-500 transition-colors hover:border-accent-600 hover:bg-accent-100/30">
        {t("quizEditor.import.dropzone")}
        <input
          type="file"
          accept=".csv,.xlsx"
          className="sr-only"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
      </label>

      {importPreview.status === "loading" && <CenteredMessage>{t("common.loading")}</CenteredMessage>}
      {importPreview.status === "error" && (
        <p role="alert" className="rounded-md bg-danger-100 p-3 text-sm text-danger-700" dir="auto">
          {importPreview.errorMessage ?? t("quizEditor.import.error")}
        </p>
      )}

      {importPreview.status === "success" && importPreview.preview && file && (
        <>
          <h2 className="font-medium" dir="auto">
            {t("quizEditor.import.previewHeading", { fileName: file.name, count: importPreview.preview.summary.total })}
          </h2>
          <ImportPreviewTable preview={importPreview.preview} />
          <p className="text-sm text-neutral-500" dir="auto">
            {t("quizEditor.import.summary", {
              willImport: importPreview.preview.summary.willImport,
              total: importPreview.preview.summary.total,
              errors: errorCount,
            })}
          </p>

          {importPreview.preview.summary.willImport > 0 && (
            <>
              <h2 className="font-medium" dir="auto">
                {t("quizEditor.import.settingsHeading")}
              </h2>
              <QuizSettingsForm
                classes={classesQuery.data}
                onSubmit={(values) => confirmImport.mutate(values)}
                isSubmitting={confirmImport.isPending}
                errorMessage={confirmImport.isError ? errorMessage(t, confirmImport.error, "quizEditor.settings.saveError") : undefined}
                submitLabel={t("quizEditor.import.confirm", { count: importPreview.preview.summary.willImport })}
              />
            </>
          )}
        </>
      )}
    </AppShell>
  );
}

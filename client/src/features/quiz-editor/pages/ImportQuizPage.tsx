import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { useTeacherClasses } from "../api/useTeacherClasses";
import { useImportPreview } from "../../../lib/useImportPreview";
import { previewQuizImportFile, confirmQuizImportFile } from "../api/importApi";
import { teacherQuizzesKey } from "../api/queryKeys";
import { ImportPreviewTable } from "../components/ImportPreviewTable";
import { QuizSettingsForm, type QuizSettingsFormValues } from "../components/QuizSettingsForm";

export function ImportQuizPage() {
  const { t } = useTranslation();
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
      navigate(`/teacher/quizzes/${result.quizId}/questions`);
    },
  });

  function handleFileChange(selected: File | null) {
    setFile(selected);
    if (selected) void importPreview.selectFile(selected);
  }

  if (classesQuery.isLoading) return <CenteredMessage>{t("common.loading")}</CenteredMessage>;
  if (classesQuery.isError || !classesQuery.data) return <CenteredMessage>{t("quizEditor.loadError")}</CenteredMessage>;

  const errorCount = importPreview.preview ? importPreview.preview.summary.total - importPreview.preview.summary.willImport : 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold" dir="auto">
        {t("quizEditor.import.title")}
      </h1>

      <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-500">
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
        <p role="alert" className="text-sm text-danger-700" dir="auto">
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
                errorMessage={confirmImport.isError ? t("quizEditor.settings.saveError") : undefined}
                submitLabel={t("quizEditor.import.confirm", { count: importPreview.preview.summary.willImport })}
              />
            </>
          )}
        </>
      )}
    </main>
  );
}

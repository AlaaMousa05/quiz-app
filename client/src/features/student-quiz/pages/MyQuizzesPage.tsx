import { useState } from "react";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { AppShell } from "../../../components/ui/AppShell";
import { Button } from "../../../components/ui/Button";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { useQuizzes } from "../api/useQuizzes";
import { QuizTabs, type QuizBucket } from "../components/QuizTabs";

export function MyQuizzesPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<QuizBucket>("open");
  const { data, isLoading, isError, refetch } = useQuizzes();

  return (
    <AppShell title={t("studentQuiz.myQuizzes")}>
      {isLoading && <CenteredMessage>{t("common.loading")}</CenteredMessage>}

      {isError && (
        <div className="flex flex-col items-start gap-2">
          <p dir="auto">{t("studentQuiz.loadError")}</p>
          <Button onClick={() => void refetch()}>{t("common.retry")}</Button>
        </div>
      )}

      {data && <QuizTabs quizzes={data} activeTab={activeTab} onChangeTab={setActiveTab} />}
    </AppShell>
  );
}

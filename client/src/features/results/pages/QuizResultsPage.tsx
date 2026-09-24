import { useParams } from "react-router-dom";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { AppShell } from "../../../components/ui/AppShell";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { queryGateMessage } from "../../../components/ui/queryGateMessage";
import { Card } from "../../../components/ui/Card";
import { Table } from "../../../components/ui/Table";
import { useResults, resultsPath, type ResultsScope } from "../api/useResults";
import { StatusBadge } from "../components/StatusBadge";
import type { StudentResult } from "../api/types";

export function QuizResultsPage({ scope }: { scope: ResultsScope }) {
  const { quizId = "" } = useParams<{ quizId: string }>();
  const { t } = useTranslation();
  const { data: results, isLoading, isError } = useResults(scope, quizId);

  const gate = queryGateMessage(t, isLoading, isError, "results.loadError");
  if (gate) return <AppShell>{gate}</AppShell>;
  if (!results) return <AppShell><CenteredMessage>{t("results.loadError")}</CenteredMessage></AppShell>;

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold" dir="auto">
          {t("results.title")}
        </h1>
        <a
          href={`/api${resultsPath(scope, quizId)}/export.csv`}
          className="inline-flex min-h-11 items-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-accent-700 hover:bg-neutral-50"
        >
          {t("results.export")}
        </a>
      </div>

      <Card className="flex flex-wrap items-center gap-4">
        <p className="text-lg font-semibold" dir="auto">
          {t("results.classAverage", { average: results.classAverage, maxPoints: results.maxPoints })}
        </p>
      </Card>

      {results.perQuestionPctCorrect.length > 0 && (
        <Card>
          <h2 className="mb-2 text-sm font-medium text-neutral-500" dir="auto">
            {t("results.perQuestion")}
          </h2>
          <div className="flex flex-wrap gap-3 text-sm">
            {results.perQuestionPctCorrect.map((q, i) => (
              <span key={q.questionId} className="rounded-full bg-neutral-100 px-3 py-1">
                Q{i + 1} · {q.pctCorrect}%
              </span>
            ))}
          </div>
        </Card>
      )}

      {results.students.length === 0 ? (
        <CenteredMessage>{t("results.empty")}</CenteredMessage>
      ) : (
        <Table<StudentResult>
          rowKey={(row) => row.studentId}
          rows={results.students}
          columns={[
            { key: "name", header: "Name", render: (row) => row.name },
            { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
            {
              key: "score",
              header: "Score",
              render: (row) => (row.score !== undefined ? t("results.score", { score: row.score, maxPoints: results.maxPoints }) : "—"),
            },
          ]}
        />
      )}
    </AppShell>
  );
}

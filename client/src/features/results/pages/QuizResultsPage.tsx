import { useParams } from "react-router-dom";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { queryGateMessage } from "../../../components/ui/queryGateMessage";
import { Table } from "../../../components/ui/Table";
import { useResults, resultsPath, type ResultsScope } from "../api/useResults";
import { StatusBadge } from "../components/StatusBadge";
import type { StudentResult } from "../api/types";

export function QuizResultsPage({ scope }: { scope: ResultsScope }) {
  const { quizId = "" } = useParams<{ quizId: string }>();
  const { t } = useTranslation();
  const { data: results, isLoading, isError } = useResults(scope, quizId);

  const gate = queryGateMessage(t, isLoading, isError, "results.loadError");
  if (gate) return gate;
  if (!results) return <CenteredMessage>{t("results.loadError")}</CenteredMessage>;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" dir="auto">
          {t("results.title")}
        </h1>
        <a href={`/api${resultsPath(scope, quizId)}/export.csv`} className="text-sm text-accent-600 underline">
          {t("results.export")}
        </a>
      </div>

      <p dir="auto">{t("results.classAverage", { average: results.classAverage, maxPoints: results.maxPoints })}</p>

      {results.perQuestionPctCorrect.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-neutral-500" dir="auto">
            {t("results.perQuestion")}
          </h2>
          <div className="flex flex-wrap gap-3 text-sm">
            {results.perQuestionPctCorrect.map((q, i) => (
              <span key={q.questionId}>
                Q{i + 1} {q.pctCorrect}%
              </span>
            ))}
          </div>
        </div>
      )}

      {results.students.length === 0 ? (
        <p className="text-sm text-neutral-500" dir="auto">
          {t("results.empty")}
        </p>
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
    </main>
  );
}

import { useTranslation } from "../../../lib/i18n/useTranslation";
import type { QuizListResponse } from "../api/types";
import { QuizCard } from "./QuizCard";

export type QuizBucket = keyof QuizListResponse;

const TABS: QuizBucket[] = ["open", "upcoming", "done"];
const TAB_LABEL_KEY = {
  open: "studentQuiz.tab.open",
  upcoming: "studentQuiz.tab.upcoming",
  done: "studentQuiz.tab.done",
} as const;
const EMPTY_KEY = {
  open: "studentQuiz.empty.open",
  upcoming: "studentQuiz.empty.upcoming",
  done: "studentQuiz.empty.done",
} as const;

export function QuizTabs({
  quizzes,
  activeTab,
  onChangeTab,
}: {
  quizzes: QuizListResponse;
  activeTab: QuizBucket;
  onChangeTab: (tab: QuizBucket) => void;
}) {
  const { t } = useTranslation();
  const activeQuizzes = quizzes[activeTab];

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex rounded-md border border-neutral-300">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={tab === activeTab}
            onClick={() => onChangeTab(tab)}
            className={`min-h-11 flex-1 border-b-2 px-3 py-2 text-sm font-medium ${
              tab === activeTab ? "border-accent-600 text-accent-600" : "border-transparent text-neutral-500"
            }`}
          >
            {t(TAB_LABEL_KEY[tab])}
          </button>
        ))}
      </div>

      {activeQuizzes.length === 0 ? (
        <p className="text-sm text-neutral-500" dir="auto">
          {t(EMPTY_KEY[activeTab])}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {activeQuizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} bucket={activeTab} />
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef } from "react";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { TimerDisplay } from "../../../components/ui/TimerDisplay";
import { useQuizTimer } from "../hooks/useQuizTimer";
import { AutosaveIndicator } from "./AutosaveIndicator";
import type { AutosaveStatus } from "../hooks/useAutosave";

// Owns the once-a-second countdown itself, so the tick only re-renders this
// header — not the question, footer nav, or dialogs the page also renders.
export function AttemptHeader({
  serverRemainingSeconds,
  onExpire,
  currentIndex,
  totalQuestions,
  autosaveStatus,
}: {
  serverRemainingSeconds: number;
  onExpire: () => void;
  currentIndex: number;
  totalQuestions: number;
  autosaveStatus: AutosaveStatus;
}) {
  const { t } = useTranslation();
  const timer = useQuizTimer(serverRemainingSeconds);
  const hasFiredExpiry = useRef(false);

  useEffect(() => {
    if (timer.isExpired && !hasFiredExpiry.current) {
      hasFiredExpiry.current = true;
      onExpire();
    }
  }, [timer.isExpired, onExpire]);

  return (
    <header className="flex flex-col gap-2 border-b border-neutral-100 p-4">
      <div className="flex items-center justify-between">
        <TimerDisplay remainingSeconds={timer.remainingSeconds} />
        <span className="text-sm text-neutral-500" dir="auto">
          {t("studentQuiz.taking.questionOf", { current: currentIndex + 1, total: totalQuestions })}
        </span>
        <AutosaveIndicator status={autosaveStatus} />
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full bg-accent-600" style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }} />
      </div>
      {autosaveStatus === "offline" && (
        <p role="alert" className="rounded-md bg-danger-100 p-2 text-xs text-danger-700" dir="auto">
          {t("studentQuiz.taking.offline")}
        </p>
      )}
    </header>
  );
}

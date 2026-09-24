import { useTranslation } from "../../../lib/i18n/useTranslation";
import type { AutosaveStatus } from "../hooks/useAutosave";

export function AutosaveIndicator({ status }: { status: AutosaveStatus }) {
  const { t } = useTranslation();
  if (status === "idle") return null;

  const isOffline = status === "offline";
  const label = status === "saved" ? t("studentQuiz.taking.saved") : t("studentQuiz.taking.saving");

  return (
    <span className={`text-xs ${isOffline ? "text-danger-700" : "text-neutral-500"}`} role="status" dir="auto">
      {isOffline ? "⚠" : "💾"} {label}
    </span>
  );
}

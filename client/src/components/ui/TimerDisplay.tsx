import { formatTimer } from "../../lib/datetime";

const WARNING_THRESHOLD_SECONDS = 120;
const DANGER_THRESHOLD_SECONDS = 30;

// Three states, escalating by color AND icon — never color alone (ui.md §1.11).
function stateFor(remainingSeconds: number): "normal" | "warning" | "danger" {
  if (remainingSeconds <= DANGER_THRESHOLD_SECONDS) return "danger";
  if (remainingSeconds <= WARNING_THRESHOLD_SECONDS) return "warning";
  return "normal";
}

const STATE_CLASSES = {
  normal: "bg-neutral-50 text-neutral-700",
  warning: "bg-warning-100 text-warning-700",
  danger: "border border-danger-700 bg-danger-100 font-bold text-danger-700",
} as const;

const STATE_ICON = { normal: "⏱", warning: "⏱", danger: "⚠" } as const;

export function TimerDisplay({ remainingSeconds }: { remainingSeconds: number }) {
  const state = stateFor(remainingSeconds);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm ${STATE_CLASSES[state]}`}
      role="timer"
      aria-live={state === "danger" ? "assertive" : state === "warning" ? "polite" : "off"}
    >
      <span aria-hidden="true">{STATE_ICON[state]}</span>
      <bdi>{formatTimer(remainingSeconds)}</bdi>
    </span>
  );
}

import { useTranslation } from "../../../lib/i18n/useTranslation";
import { Button } from "../../../components/ui/Button";

export function AttemptFooterNav({
  isFirst,
  isLast,
  onPrev,
  onNext,
  onOpenGrid,
  onOpenSubmitConfirm,
}: {
  isFirst: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  onOpenGrid: () => void;
  onOpenSubmitConfirm: () => void;
}) {
  const { t } = useTranslation();

  return (
    <footer className="flex items-center justify-between gap-2 border-t border-neutral-100 p-4">
      <Button disabled={isFirst} onClick={onPrev}>
        {t("studentQuiz.taking.prev")}
      </Button>
      <Button onClick={onOpenGrid}>{t("studentQuiz.taking.grid")}</Button>
      {isLast ? (
        <Button variant="primary" onClick={onOpenSubmitConfirm}>
          {t("studentQuiz.taking.submitQuiz")}
        </Button>
      ) : (
        <Button onClick={onNext}>{t("studentQuiz.taking.next")}</Button>
      )}
    </footer>
  );
}

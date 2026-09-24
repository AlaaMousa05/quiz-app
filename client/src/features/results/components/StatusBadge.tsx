import type { TranslationKey } from "shared";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { Badge, type BadgeTone } from "../../../components/ui/Badge";
import type { StudentStatus } from "../api/types";

const STATUS_KEY: Record<StudentStatus, TranslationKey> = {
  NOT_STARTED: "results.status.notStarted",
  IN_PROGRESS: "results.status.inProgress",
  SUBMITTED: "results.status.submitted",
  AUTO_FINALIZED: "results.status.autoFinalized",
};

const STATUS_TONE: Record<StudentStatus, BadgeTone> = {
  NOT_STARTED: "neutral",
  IN_PROGRESS: "warning",
  SUBMITTED: "success",
  AUTO_FINALIZED: "success",
};

export function StatusBadge({ status }: { status: StudentStatus }) {
  const { t } = useTranslation();
  return <Badge tone={STATUS_TONE[status]}>{t(STATUS_KEY[status])}</Badge>;
}

import { useTranslation } from "../../../lib/i18n/useTranslation";
import { Card } from "../../../components/ui/Card";
import type { AdminClass, ClassStudent } from "../api/types";

export function StudentRow({
  student,
  otherClasses,
  onMove,
  isMoving,
}: {
  student: ClassStudent;
  otherClasses: AdminClass[];
  onMove: (toClassId: string) => void;
  isMoving: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Card className="flex items-center justify-between gap-2">
      <div>
        <p dir="auto">{student.name}</p>
        <p className="text-sm text-neutral-500">{student.username}</p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <span dir="auto">{isMoving ? t("admin.classDetail.moving") : t("admin.classDetail.moveTo")}</span>
        <select
          className="min-h-11 rounded-md border border-neutral-300 px-2"
          disabled={isMoving || otherClasses.length === 0}
          value=""
          onChange={(e) => e.target.value && onMove(e.target.value)}
        >
          <option value="" disabled>
            {t("admin.classDetail.moveTo")}
          </option>
          {otherClasses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
    </Card>
  );
}

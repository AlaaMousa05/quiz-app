import { useTranslation } from "../../../lib/i18n/useTranslation";
import type { ImportPreview, ImportRow } from "../api/types";

const ICON: Record<ImportRow["status"], string> = {
  OK: "✓",
  OK_NEW_CLASS: "✓",
  DUPLICATE_SKIPPED: "•",
  ERROR: "✗",
};

const ROW_TONE: Record<ImportRow["status"], string> = {
  OK: "bg-success-100 text-success-700",
  OK_NEW_CLASS: "bg-warning-100 text-warning-700",
  DUPLICATE_SKIPPED: "bg-neutral-100 text-neutral-700",
  ERROR: "bg-danger-100 text-danger-700",
};

export function ImportPreviewList({ preview }: { preview: ImportPreview }) {
  const { t } = useTranslation();

  function describe(row: ImportRow): string {
    if (row.status === "ERROR") return `Row ${row.rowNumber}: ${row.error}`;
    if (row.status === "DUPLICATE_SKIPPED") return `${row.name} — ${t("admin.import.duplicate")}`;
    const suffix = row.status === "OK_NEW_CLASS" ? ` (${t("admin.import.newClass")})` : "";
    return `${row.name}${row.className ? ` — ${row.className}` : ""}${suffix}`;
  }

  return (
    <div className="flex flex-col gap-2">
      {preview.rows.map((row) => (
        <div key={row.rowNumber} className={`flex items-start gap-2 rounded-md px-3 py-2 text-sm ${ROW_TONE[row.status]}`} dir="auto">
          <span aria-hidden="true">{ICON[row.status]}</span>
          <span>{describe(row)}</span>
        </div>
      ))}
    </div>
  );
}

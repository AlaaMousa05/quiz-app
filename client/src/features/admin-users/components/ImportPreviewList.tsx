import { useTranslation } from "../../../lib/i18n/useTranslation";
import type { ImportPreview, ImportRow } from "../api/types";

const ICON: Record<ImportRow["status"], string> = {
  OK: "✓",
  OK_NEW_CLASS: "✓",
  DUPLICATE_SKIPPED: "•",
  ERROR: "✗",
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
        <div key={row.rowNumber} className="flex items-start gap-2 text-sm" dir="auto">
          <span aria-hidden="true">{ICON[row.status]}</span>
          <span>{describe(row)}</span>
        </div>
      ))}
    </div>
  );
}

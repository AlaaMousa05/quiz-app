import type { QuizImportPreview } from "shared";

export function ImportPreviewTable({ preview }: { preview: QuizImportPreview }) {
  return (
    <div className="flex flex-col gap-2">
      {preview.rows.map((row) => (
        <div key={row.rowNumber} className="flex items-start gap-2 text-sm" dir="auto">
          <span aria-hidden="true">{row.status === "OK" ? "✓" : "✗"}</span>
          <span>
            {row.status === "OK"
              ? `Row ${row.rowNumber}: "${row.questionText}" — ${row.points} pts`
              : `Row ${row.rowNumber}: ${row.error}`}
          </span>
        </div>
      ))}
    </div>
  );
}

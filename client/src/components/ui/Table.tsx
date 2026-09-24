import type { ReactNode } from "react";
import { Card } from "./Card";

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
}

// Below 640px, any data table restructures into a stack of cards — one card
// per row, each field as a `label: value` line (ui.md §1.8). At >=640px it's
// a conventional table. One component, not two screens to maintain.
export function Table<T>({ columns, rows, rowKey }: TableProps<T>) {
  return (
    <>
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((row) => (
          <Card key={rowKey(row)}>
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between gap-2 py-1 text-sm">
                <span className="text-neutral-500">{col.header}</span>
                <span dir="auto">{col.render(row)}</span>
              </div>
            ))}
          </Card>
        ))}
      </div>
      <table className="hidden w-full border-collapse text-start sm:table">
        <thead>
          <tr className="border-b border-neutral-100 text-start text-sm text-neutral-500">
            {columns.map((col) => (
              <th key={col.key} className="px-3 py-2 text-start font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-neutral-100">
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2 text-sm" dir="auto">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

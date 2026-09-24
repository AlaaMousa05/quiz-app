import type { InputHTMLAttributes } from "react";

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Field({ label, id, ...inputProps }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5" htmlFor={id}>
      <span className="text-sm font-medium text-neutral-700" dir="auto">
        {label}
      </span>
      <input
        id={id}
        className="min-h-11 rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 outline-none transition-colors focus:border-accent-600 focus:ring-2 focus:ring-accent-100 disabled:bg-neutral-50 disabled:text-neutral-500"
        {...inputProps}
      />
    </label>
  );
}

import type { InputHTMLAttributes } from "react";

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Field({ label, id, ...inputProps }: FieldProps) {
  return (
    <label className="flex flex-col gap-1" htmlFor={id}>
      <span dir="auto">{label}</span>
      <input id={id} className="min-h-11 rounded-md border border-neutral-300 px-3 py-2" {...inputProps} />
    </label>
  );
}

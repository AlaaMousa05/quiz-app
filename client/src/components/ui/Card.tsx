import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-neutral-100 bg-white p-4 shadow-[0_1px_2px_rgba(17,19,24,0.06)] ${className}`}
      {...props}
    />
  );
}

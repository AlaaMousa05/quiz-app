import type { ReactNode } from "react";

export function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <p className="text-neutral-500" dir="auto">
        {children}
      </p>
    </div>
  );
}

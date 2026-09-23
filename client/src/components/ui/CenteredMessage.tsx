import type { ReactNode } from "react";

export function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <p dir="auto">{children}</p>
    </main>
  );
}

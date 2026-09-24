import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "destructive";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-accent-600 text-white shadow-sm hover:bg-accent-700 focus-visible:ring-accent-600",
  secondary: "border border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500 hover:bg-neutral-50 focus-visible:ring-neutral-500",
  destructive: "bg-danger-100 text-danger-700 hover:bg-danger-700 hover:text-white focus-visible:ring-danger-700",
};

// Shared with LinkButton so a navigation link can look exactly like a button
// (ui.md §1.5) without duplicating the variant styles.
export function buttonClassName(variant: ButtonVariant, className = ""): string {
  return `inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${VARIANT_CLASSES[variant]} ${className}`;
}

export function Button({ variant = "secondary", className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClassName(variant, className)} {...props} />;
}

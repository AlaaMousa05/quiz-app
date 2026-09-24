import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "destructive";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-accent-600 text-white hover:bg-accent-700",
  secondary: "border border-neutral-300 text-neutral-700 hover:bg-neutral-50",
  destructive: "border border-danger-700 text-danger-700 hover:bg-danger-100",
};

// Shared with LinkButton so a navigation link can look exactly like a button
// (ui.md §1.5) without duplicating the variant styles.
export function buttonClassName(variant: ButtonVariant, className = ""): string {
  return `inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 py-2 text-sm font-medium disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`;
}

export function Button({ variant = "secondary", className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClassName(variant, className)} {...props} />;
}

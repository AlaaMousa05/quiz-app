import type { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-neutral-900 text-white",
  secondary: "border border-neutral-300 hover:bg-neutral-50",
};

export function Button({ variant = "secondary", className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`min-h-11 min-w-11 rounded-md px-3 py-2 text-sm font-medium disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}

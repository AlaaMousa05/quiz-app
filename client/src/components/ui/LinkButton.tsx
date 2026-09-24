import { Link, type LinkProps } from "react-router-dom";
import { buttonClassName, type ButtonVariant } from "./Button";

export interface LinkButtonProps extends LinkProps {
  variant?: ButtonVariant;
}

export function LinkButton({ variant = "secondary", className = "", ...props }: LinkButtonProps) {
  return <Link className={buttonClassName(variant, className)} {...props} />;
}

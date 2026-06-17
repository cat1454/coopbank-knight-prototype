import type { ButtonHTMLAttributes, ReactNode } from "react";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export function PrimaryButton({
  children,
  icon,
  variant = "primary",
  className = "",
  type = "button",
  ...buttonProps
}: PrimaryButtonProps) {
  return (
    <button className={`app-button app-button--${variant} ${className}`} type={type} {...buttonProps}>
      {icon ? <span className="app-button__icon">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}

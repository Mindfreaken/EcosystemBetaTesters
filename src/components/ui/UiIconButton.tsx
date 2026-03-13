"use client";

import React from "react";

type IconButtonVariant = "default" | "primary" | "secondary" | "ghost" | "danger";
type IconButtonSize = "xs" | "sm" | "md" | "lg";

export type UiIconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  circular?: boolean; // defaults true
  active?: boolean;
  loading?: boolean;
  className?: string;
  tooltip?: string; // uses native title
};

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

const base = "inline-flex items-center justify-center flex-shrink-0 rounded-md border text-[color:var(--foreground)] bg-[color:var(--muted)] border-[color:var(--border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] disabled:opacity-60 disabled:cursor-not-allowed select-none transition-all duration-200";

const sizes: Record<IconButtonSize, string> = {
  xs: "h-7 w-7 text-[12px]",
  sm: "h-8 w-8 text-[13px]",
  md: "h-9 w-9 text-[14px]",
  lg: "h-11 w-11 text-[16px]",
};

const variants: Record<IconButtonVariant, string> = {
  default: cx(
    "text-[color:var(--muted-foreground)]",
    "bg-transparent border border-transparent",
    "hover:bg-[color:color-mix(in_oklab,var(--primary),transparent_90%)] hover:text-[color:var(--foreground)]"
  ),
  primary: cx(
    "text-[color:var(--primary-foreground)]",
    "bg-[color:var(--primary)]",
    "border border-[color:var(--border)]",
    "hover:opacity-90"
  ),
  secondary: cx(
    "text-[color:var(--foreground)]",
    "bg-[color:var(--muted)]",
    "border border-[color:var(--border)]",
    "hover:bg-[color:color-mix(in_oklab,var(--primary),transparent_92%)]"
  ),
  ghost: cx(
    "text-[color:var(--muted-foreground)]",
    "bg-transparent border border-transparent",
    "hover:bg-[color:color-mix(in_oklab,var(--foreground),transparent_96%)]"
  ),
  danger: cx(
    "text-[color:var(--destructive-foreground)]",
    "bg-[color:var(--destructive)]",
    "border border-[color:color-mix(in_oklab,var(--destructive),transparent_30%)]",
    "hover:bg-[color:color-mix(in_oklab,var(--destructive),transparent_10%)]"
  ),
};

const spinner = (
  <svg className="animate-spin" viewBox="0 0 24 24" width="16" height="16" aria-hidden>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

export const UiIconButton = React.forwardRef<HTMLButtonElement, UiIconButtonProps>(function UiIconButton(
  { variant = "default", size = "md", circular = true, active, loading, className, tooltip, children, disabled, ...rest },
  ref
) {
  const classes = cx(
    base,
    sizes[size],
    circular ? "rounded-full" : "rounded-md",
    variants[variant],
    active && "ring-2 ring-[color:var(--primary)]",
    className
  );

  return (
    <button
      ref={ref}
      className={classes}
      title={tooltip}
      data-variant={variant}
      data-size={size}
      data-loading={loading ? "true" : undefined}
      aria-pressed={active || undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? spinner : children}
    </button>
  );
});

export default UiIconButton;



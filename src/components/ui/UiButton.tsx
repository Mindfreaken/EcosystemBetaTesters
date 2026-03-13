"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
  circular?: boolean;
  loading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
};

export type UiButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & CommonProps;

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

const baseStyles = "inline-flex items-center justify-center font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-[color:var(--primary)] disabled:opacity-60 disabled:cursor-not-allowed select-none";

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-9 px-3.5 text-[14px] gap-2",
  lg: "h-11 px-5 text-[15px] gap-2.5",
  icon: "h-9 w-9 p-0",
};

const shapeStyles = (pill?: boolean, circular?: boolean) =>
  circular ? "rounded-full" : pill ? "rounded-2xl" : "rounded-md";

const variantStyles: Record<ButtonVariant, string> = {
  primary: cx(
    "text-[color:var(--primary-foreground)]",
    "bg-[color:var(--primary)]",
    "border border-[color:var(--border)]",
    "shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)]",
    "hover:opacity-90 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.4)]",
    "active:opacity-80"
  ),
  secondary: cx(
    "text-[color:var(--foreground)]",
    "bg-[color:var(--muted)]",
    "border border-[color:var(--border)]",
    "hover:bg-[color:color-mix(in_oklab,var(--primary),transparent_92%)]"
  ),
  outline: cx(
    "text-[color:var(--foreground)]",
    "bg-transparent",
    "border border-[color:var(--border)]",
    "hover:bg-[color:color-mix(in_oklab,var(--primary),transparent_92%)]"
  ),
  ghost: cx(
    "text-[color:var(--muted-foreground)]",
    "bg-transparent border border-transparent",
    "hover:bg-[color:color-mix(in_oklab,var(--foreground),transparent_96%)] hover:text-[color:var(--foreground)]"
  ),
  danger: cx(
    "text-[color:var(--destructive-foreground)]",
    "bg-[color:var(--destructive)]",
    "border border-[color:color-mix(in_oklab,var(--destructive),transparent_30%)]",
    "hover:bg-[color:color-mix(in_oklab,var(--destructive),transparent_10%)]"
  ),
};

const spinner = (
  <svg
    className="animate-spin"
    viewBox="0 0 24 24"
    width="16"
    height="16"
    aria-hidden
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
      fill="none"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

export const UiButton = React.forwardRef<HTMLButtonElement, UiButtonProps>(function UiButton(
  {
    variant = "primary",
    size = "md",
    pill,
    circular,
    loading,
    startIcon,
    endIcon,
    className,
    fullWidth,
    children,
    disabled,
    ...rest
  },
  ref
) {
  const isIconOnly = size === "icon" || (!children && !!(startIcon || endIcon));
  const shape = shapeStyles(pill, circular || isIconOnly);
  const classes = cx(
    baseStyles,
    sizeStyles[size],
    shape,
    variantStyles[variant],
    fullWidth ? "w-full" : "",
    className
  );

  return (
    <button
      ref={ref}
      className={classes}
      data-variant={variant}
      data-size={size}
      data-loading={loading ? "true" : undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="mr-2 -ml-0.5 inline-flex">{spinner}</span>}
      {startIcon && <span className={cx(children ? "-ml-0.5" : "", "inline-flex items-center")}>{startIcon}</span>}
      {children && <span>{children}</span>}
      {endIcon && <span className="inline-flex items-center">{endIcon}</span>}
    </button>
  );
});

export default UiButton;



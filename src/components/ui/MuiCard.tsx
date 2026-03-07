"use client";

import React from "react";
import Card from "@mui/material/Card";

type CardVariant = "surface" | "outline" | "elevated" | "interactive" | "tinted" | "ghost" | "profile";
type CardSize = "sm" | "md" | "lg";

type CommonProps = {
  variant?: CardVariant;
  size?: CardSize;
  hoverable?: boolean;
  clickable?: boolean;
  selected?: boolean;
  className?: string;
  children?: React.ReactNode;
  sx?: any;
};

export type MuiCardProps = React.HTMLAttributes<HTMLDivElement> & CommonProps;

function shadowBase() {
  return "0 2px 8px color-mix(in oklab, var(--foreground) 10%, var(--card) 90%)";
}
function shadowHover() {
  return "0 6px 18px color-mix(in oklab, var(--foreground) 12%, var(--card) 88%)";
}

export const MuiCard = React.forwardRef<HTMLDivElement, MuiCardProps>(function MuiCard(
  { variant = "elevated", size = "md", hoverable, clickable, selected, className, style, sx: sxOverride, children, onClick, ...rest },
  ref
) {
  const padding = size === "sm" ? 8 : size === "lg" ? 16 : 12;
  const isClickable = clickable || typeof onClick === "function";

  const baseSx: any = {
    p: 0,
    borderRadius: 2,
    overflow: "hidden",
    border: "1px solid",
    transition: "transform .2s ease, box-shadow .2s ease, background-color .2s ease",
    outline: "none",
    '&:focus-visible': { boxShadow: `0 0 0 2px var(--highlight)` },
  };

  const sxByVariant: Record<CardVariant, any> = {
    surface: {
      backgroundColor: "var(--card)",
      borderColor: "color-mix(in oklab, var(--foreground), transparent 90%)",
      boxShadow: "0 1px 2px color-mix(in oklab, var(--foreground) 8%, transparent)",
    },
    outline: {
      backgroundColor: "transparent",
      borderColor: "color-mix(in oklab, var(--foreground), transparent 85%)",
      boxShadow: "none",
    },
    elevated: {
      backgroundColor: "var(--card)",
      borderColor: "color-mix(in oklab, var(--foreground), transparent 88%)",
      boxShadow: shadowBase(),
    },
    interactive: {
      backgroundColor: "var(--card)",
      borderColor: "color-mix(in oklab, var(--foreground), transparent 88%)",
      boxShadow: shadowBase(),
      '&:hover': {
        transform: "translateY(-2px)",
        boxShadow: shadowHover(),
        backgroundColor: "color-mix(in oklab, var(--card) 96%, var(--primary) 4%)",
      },
    },
    profile: {
      backgroundColor: "var(--card)",
      // Slightly stronger border to echo profile card panel
      borderColor: "color-mix(in oklab, var(--foreground), transparent 86%)",
      boxShadow: shadowBase(),
      '&:hover': {
        transform: "translateY(-2px)",
        boxShadow: shadowHover(),
      },
    },
    tinted: {
      backgroundColor: "color-mix(in oklab, var(--card) 96%, var(--primary) 4%)",
      borderColor: "color-mix(in oklab, var(--foreground), transparent 86%)",
      boxShadow: shadowBase(),
    },
    ghost: {
      backgroundColor: "transparent",
      borderColor: "transparent",
      boxShadow: "none",
      '&:hover': { backgroundColor: "color-mix(in oklab, var(--foreground), transparent 96%)" },
    },
  };

  const sx = { ...baseSx, ...(sxByVariant[variant] || {}), cursor: isClickable ? "pointer" : undefined, ...(sxOverride || {}) };

  return (
    <Card
      ref={ref as any}
      elevation={0}
      sx={sx}
      className={className}
      onClick={onClick as any}
      {...rest}
    >
      <div style={{ padding }}>
        {children}
      </div>
    </Card>
  );
});

export default MuiCard;

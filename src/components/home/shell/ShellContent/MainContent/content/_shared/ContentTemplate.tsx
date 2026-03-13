"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { themeVar } from "@/theme/registry";

export interface ContentTemplateProps {
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  headerRightFullWidth?: boolean; // when true, headerRight spans full width below title/subtitle
  children?: React.ReactNode;
  maxWidth?: number | string; // e.g., 1200 (default) or 'none' for full-bleed
  gutterX?: any; // responsive px for horizontal gutters, defaults to { xs: 2, sm: 3, md: 4 }
  gutterY?: any; // responsive py for vertical gutters, defaults to { xs: 2, sm: 3, md: 4 }
}

/**
 * ContentTemplate
 * - Provides a consistent, reusable canvas with the Cyberpunk background used in Home
 * - Includes the subtle neon grid overlay
 * - Offers an optional header with title/subtitle and a right-aligned area
 */
export default function ContentTemplate({ children, maxWidth = 1200, gutterX = { xs: 2, sm: 3, md: 4 }, gutterY = { xs: 2, sm: 3, md: 4 } }: ContentTemplateProps) {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "auto",
        borderRadius: 0,
        bgcolor: "transparent",
        py: gutterY,
        px: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Neon grid overlay */}
      <Box
        aria-hidden
        sx={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          opacity: 0.08,
          backgroundImage:
            `linear-gradient(${themeVar("border")} 1px, transparent 1px), linear-gradient(90deg, ${themeVar("border")} 1px, transparent 1px)`,
          backgroundSize: "32px 32px, 32px 32px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          borderRadius: "inherit",
        }}
      />

      {/* Content container */}
      <Box sx={{ position: "relative", zIndex: 1, width: "100%", maxWidth: maxWidth, mx: maxWidth === 'none' ? 0 : "auto", color: themeVar("foreground"), flex: 1, display: "flex", flexDirection: "column", gap: 2, px: gutterX }}>
        {/* Scrollable body */}
        <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>{children}</Box>
      </Box>
    </Box>
  );
}



"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

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
export default function ContentTemplate({ title, subtitle, headerRight, headerRightFullWidth = false, children, maxWidth = 1200, gutterX = { xs: 2, sm: 3, md: 4 }, gutterY = { xs: 2, sm: 3, md: 4 } }: ContentTemplateProps) {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "auto",
        // Fill to the edges — no rounded corners
        borderRadius: 0,
        bgcolor: "transparent",
        // Layered cyberpunk background using theme variables
        backgroundImage: `
          radial-gradient(1200px 600px at 10% -10%, var(--highlight) 0%, transparent 60%),
          radial-gradient(1000px 500px at 110% 110%, var(--secondaryHover) 0%, transparent 60%),
          radial-gradient(800px 400px at -10% 110%, var(--primaryHover) 0%, transparent 60%),
          linear-gradient(135deg, var(--background) 0%, var(--backgroundAlt) 60%)
        `,
        backgroundBlendMode: "screen, screen, screen, normal",
        // Outer shell uses only vertical padding; horizontal gutters are applied on inner content container
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
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "32px 32px, 32px 32px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          borderRadius: "inherit",
        }}
      />

      {/* Content container */}
      <Box sx={{ position: "relative", zIndex: 1, width: "100%", maxWidth: maxWidth, mx: maxWidth === 'none' ? 0 : "auto", color: "var(--textPrimary)", flex: 1, display: "flex", flexDirection: "column", gap: 2, px: gutterX }}>
        {(title || subtitle || headerRight) && (
          <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ minWidth: 0 }}>
              {title && (
                <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1, color: "var(--textLight)", textShadow: "0 0 12px var(--highlight)" }}>
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="body2" sx={{ color: "var(--textSecondary)", mt: 0.5 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            {headerRight && (
              <Box sx={headerRightFullWidth ? { flexBasis: "100%", width: "100%" } : { flexShrink: 0 }}>
                {headerRight}
              </Box>
            )}
          </Box>
        )}

        {/* Scrollable body */}
        <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>{children}</Box>
      </Box>
    </Box>
  );
}

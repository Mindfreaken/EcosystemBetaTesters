"use client";

import React, { PropsWithChildren } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface SectionHeaderProps {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export default function SectionHeader({ title, left, right }: PropsWithChildren<SectionHeaderProps>) {
  const hasTitle = !!(title && title.trim());
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: hasTitle ? "auto 1fr auto" : "auto auto",
        alignItems: "center",
        px: hasTitle ? 1.5 : 0.75,
        py: 0,
        // Explicitly pin font metrics and box size to avoid subpixel rounding
        fontSize: 14,
        lineHeight: 1,
        height: 56,
        minHeight: 56,
        boxSizing: "border-box",
        borderBottom: "1px solid var(--border)",
        backgroundColor: "color-mix(in oklab, var(--card), transparent 94%)",
        "& .MuiIconButton-root": {
          width: 28,
          height: 28,
          padding: 0.5,
        },
        "& > .MuiBox-root:last-child": {
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>{left}</Box>
      {hasTitle && (
        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1, px: 1, fontSize: 14 }}>
          {title}
        </Typography>
      )}
      <Box sx={{ minWidth: hasTitle ? 100 : 0, display: "flex", alignItems: "center", gap: 0.5 }}>{right}</Box>
    </Box>
  );
}



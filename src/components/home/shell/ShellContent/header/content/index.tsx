"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { PanelLeft, PanelRight } from "lucide-react";

// Keep this file focused on the HEADER CONTENT ONLY (no shell styling)
// The Shell header wrapper (background/border/padding) lives in shell-layout.tsx
export interface HeaderContentProps {
  onToggleLeft: () => void;
  onToggleRight: () => void;
  headerRight?: React.ReactNode;
  title?: string;
}

export default function HeaderContent({ onToggleLeft, onToggleRight, headerRight, title = "EcoSystem Testers Beta" }: HeaderContentProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          size="small"
          onClick={onToggleLeft}
          sx={{
            color: "var(--textSecondary)",
            "&:hover": {
              backgroundColor: "color-mix(in oklab, var(--primary), transparent 88%)",
              color: "var(--textPrimary)",
            },
          }}
        >
          <PanelLeft size={16} />
        </IconButton>
        <img
          src="/achievements/early_adopter_sticker.png"
          alt="Ecosystem Logo"
          style={{ width: 24, height: 24, borderRadius: '4px' }}
        />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {headerRight}
        <IconButton
          size="small"
          onClick={onToggleRight}
          sx={{
            color: "var(--textSecondary)",
            "&:hover": {
              backgroundColor: "color-mix(in oklab, var(--primary), transparent 88%)",
              color: "var(--textPrimary)",
            },
          }}
        >
          <PanelRight size={16} />
        </IconButton>
      </Box>
    </Box>
  );
}


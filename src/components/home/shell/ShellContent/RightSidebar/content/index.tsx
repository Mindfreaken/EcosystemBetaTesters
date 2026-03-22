"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { X } from "lucide-react";
import { Megaphone, MessageSquare, Bug, Lightbulb, FlaskConical, Home as HomeIcon } from "lucide-react";
import { useShellView } from "../../viewContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

// Keep this file focused on the RIGHT SIDEBAR CONTENT ONLY (no shell styling)
// The Shell right sidebar wrapper (background/border/padding/width) lives in shell-layout.tsx
export interface RightSidebarContentProps {
  onClose: () => void;
}

export default function RightSidebarContent({ onClose }: RightSidebarContentProps) {
  const { setView } = useShellView();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <>
      <Box sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 40,
        mb: 1.5
      }}>
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>

        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          aria-label="Close sidebar"
          sx={{
            p: 0.5,
            color: "var(--muted-foreground)",
            transition: "all 0.2s ease",
            "&:hover": {
              color: "var(--foreground)",
              backgroundColor: "color-mix(in oklab, var(--primary), transparent 90%)",
              transform: "scale(1.1)",
            }
          }}
        >
          <X size={18} strokeWidth={2.5} />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {/* Hub links removed as EcoSystemHub is decommissioned */}
      </Box>
    </>
  );
}




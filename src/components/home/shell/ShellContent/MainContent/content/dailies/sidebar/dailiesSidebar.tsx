"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Home as HomeIcon, Gamepad2, Puzzle, Sword } from "lucide-react";
import SectionHeader from "../../chat/content/header/SectionHeader";
import { themeVar } from "@/theme/registry";

export interface DailiesSidebarProps {
  selectedId?: string | null;
  onSelect: (dailies: { id: string; name: string } | null) => void;
  collapsed?: boolean;
}

// Styling mirrors the interactive nav item styling used in the Shell Left Sidebar
// (hover translate, subtle gradient overlay, blended colors, left border on hover)
export default function DailiesSidebar({ selectedId, onSelect, collapsed = false }: DailiesSidebarProps) {
  const items = [
    { id: "nerdle", name: "Nerdle", icon: <Puzzle size={16} /> },
    { id: "dungeon-deal", name: "Dungeon Deal", icon: <Sword size={16} /> },
  ];

  return (
    <div className="h-full text-sm" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <SectionHeader
        title={"Dailies"}
        left={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              size="small"
              aria-label="Go to dailiess home"
              onClick={() => onSelect(null)}
              sx={{
                color: "var(--secondary)",
                '&:hover': {
                  backgroundColor: 'color-mix(in oklab, var(--secondary), transparent 90%)',
                },
              }}
            >
              <HomeIcon size={16} />
            </IconButton>
            {/* Context icon for the section */}
            <Gamepad2 size={16} color={themeVar("secondary")} />
          </Box>
        }
      />
      {collapsed ? (
        // Icons-only rail when collapsed
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 1 }}>
          {items.map((item) => {
            const active = selectedId === item.id;
            return (
              <Tooltip key={item.id} title={item.name} placement="right">
                <IconButton
                  size="small"
                  onClick={() => onSelect(item)}
                  sx={{
                    width: 36,
                    height: 36,
                    color: active ? themeVar("primary") : themeVar("secondary"),
                    backgroundColor: active ? `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)` : 'transparent',
                    '&:hover': {
                      backgroundColor: `color-mix(in oklab, ${themeVar("primary")}, transparent 92%)`,
                      color: themeVar("foreground")
                    }
                  }}
                >
                  {items.find((i) => i.id === item.id)?.icon}
                </IconButton>
              </Tooltip>
            );
          })}
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {items.map((item) => {
            const active = selectedId === item.id;
            return (
              <Box
                key={item.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 1.0,
                  borderRadius: 1,
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                  color: active
                    ? themeVar("foreground")
                    : `color-mix(in oklab, ${themeVar("foreground")}, transparent 30%)`,
                  borderLeft: active ? `3px solid ${themeVar("primary")}` : "3px solid transparent",
                  transition: "transform .2s ease, box-shadow .2s ease, background-color .2s ease, border-color .2s ease",
                  backgroundColor: active
                    ? `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)`
                    : `color-mix(in oklab, ${themeVar("card")}, transparent 92%)`,
                  "&:hover": {
                    transform: "translateX(4px) scale(1.01)",
                    backgroundColor: `color-mix(in oklab, ${themeVar("primary")}, transparent 92%)`,
                    boxShadow: `0 4px 8px color-mix(in oklab, ${themeVar("foreground")}, transparent 95%)`,
                    color: themeVar("foreground"),
                    borderLeftColor: themeVar("primary"),
                  },
                  "&::before": {
                    content: "''",
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    background:
                      `linear-gradient(135deg, transparent 0%, color-mix(in oklab, ${themeVar("foreground")}, transparent 92%) 100%)`,
                    transform: "translateX(-100%)",
                    transition: "transform .3s ease-out",
                  },
                  "&:hover::before": {
                    transform: "translateX(0)",
                  },
                }}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelect(item);
                }}
              >
                <Box sx={{ fontSize: 0, display: "grid", placeItems: "center", minWidth: 24 }}>
                  {item.icon}
                </Box>
                <Typography variant="body2">{item.name}</Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </div>
  );
}



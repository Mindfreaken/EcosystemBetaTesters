"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Home as HomeIcon, Gamepad2, Puzzle, Sword } from "lucide-react";
import SectionHeader from "../../chat/content/header/SectionHeader";

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
            <Gamepad2 size={16} color="var(--secondary)" />
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
                    color: active ? 'var(--primary)' : 'var(--secondary)',
                    backgroundColor: active ? 'color-mix(in oklab, var(--primary), transparent 90%)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'color-mix(in oklab, var(--primary), transparent 92%)',
                      color: 'var(--textPrimary)'
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
                    ? "var(--textPrimary)"
                    : "color-mix(in oklab, var(--foreground), transparent 30%)",
                  borderLeft: active ? "3px solid var(--primary)" : "3px solid transparent",
                  transition: "transform .2s ease, box-shadow .2s ease, background-color .2s ease, border-color .2s ease",
                  backgroundColor: active
                    ? "color-mix(in oklab, var(--primary), transparent 90%)"
                    : "color-mix(in oklab, var(--card), transparent 92%)",
                  "&:hover": {
                    transform: "translateX(4px) scale(1.01)",
                    backgroundColor: "color-mix(in oklab, var(--primary), transparent 92%)",
                    boxShadow: "0 4px 8px color-mix(in oklab, var(--foreground), transparent 95%)",
                    color: "var(--textPrimary)",
                    borderLeftColor: "var(--primary)",
                  },
                  "&::before": {
                    content: "''",
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 100%)",
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

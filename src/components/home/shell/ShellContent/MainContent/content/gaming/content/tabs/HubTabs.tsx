"use client";

import React from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import useMediaQuery from "@mui/material/useMediaQuery";
import { gameHubs, GameHubKey } from "../tabsConfig";

export default function HubTabs({ value, onChange }: { value: GameHubKey; onChange: (val: GameHubKey) => void }) {
  const isMdUp = useMediaQuery("(min-width:900px)");
  const currentIndex = gameHubs.findIndex((t) => t.key === value);
  return (
    <Tabs
      value={currentIndex < 0 ? 0 : currentIndex}
      onChange={(_, idx: number) => onChange(gameHubs[idx].key)}
      variant={isMdUp ? "standard" : "scrollable"}
      centered={isMdUp}
      scrollButtons={isMdUp ? false : "auto"}
      TabIndicatorProps={{
        sx: {
          height: 24,
          borderRadius: 999,
          background:
            "linear-gradient(180deg, color-mix(in oklab, #ffffff, transparent 88%), color-mix(in oklab, var(--primaryLight), transparent 82%))",
          boxShadow: "none",
          border: "1px solid color-mix(in oklab, var(--border), transparent 28%)",
          backdropFilter: "blur(6px) saturate(1.2)",
          zIndex: 0,
          top: "50%",
          bottom: "auto",
          transform: "translateY(-50%)",
          marginTop: 0,
          marginBottom: 0,
        },
      }}
      sx={{
        minHeight: 28,
        maxWidth: { md: 1100 },
        mx: { md: "auto" },
        display: "flex",
        alignItems: "center",
        '.MuiTabs-flexContainer': { gap: 0.75 },
        mb: 0.25,
      }}
    >
      {gameHubs.map((t) => (
        <Tab
          key={t.key}
          disableRipple
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box sx={{ fontSize: 0, display: "grid", placeItems: "center" }}>{t.icon}</Box>
              <Box component="span" sx={{ fontWeight: 700, letterSpacing: 0.2, fontSize: 12 }}>
                {t.label}
              </Box>
            </Box>
          }
          sx={{
            minHeight: 28,
            py: 0.25,
            px: 1,
            color: "color-mix(in oklab, var(--foreground), transparent 30%)",
            textTransform: "none",
            fontSize: 11,
            fontWeight: 700,
            transition: "color .2s ease",
            position: "relative",
            zIndex: 1,
            '&.Mui-selected': {
              color: "var(--textPrimary)",
              textShadow: "0 0 12px color-mix(in oklab, var(--highlight), transparent 55%)",
            },
            ":hover": {
              color: "var(--textPrimary)",
            },
            '&:not(.Mui-selected):hover::after': {
              content: "''",
              position: "absolute",
              left: 10,
              right: 10,
              bottom: 4,
              height: 2,
              borderRadius: 2,
              background:
                "linear-gradient(90deg, color-mix(in oklab, var(--primaryLight), transparent 30%), color-mix(in oklab, var(--secondaryLight), transparent 40%))",
              boxShadow: "0 0 12px color-mix(in oklab, var(--highlight), transparent 70%)",
            },
          }}
        />
      ))}
    </Tabs>
  );
}

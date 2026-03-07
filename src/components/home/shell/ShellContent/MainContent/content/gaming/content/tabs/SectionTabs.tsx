"use client";

import React from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import useMediaQuery from "@mui/material/useMediaQuery";
import { gamingTabs, GamingTabKey } from "../tabsConfig";

export default function SectionTabs({ value, onChange }: { value: GamingTabKey; onChange: (val: GamingTabKey) => void }) {
  const isMdUp = useMediaQuery("(min-width:900px)");
  // Always hide Gaming Home, Collections, Achievements, and My Team across all sections for now
  const visibleTabs = gamingTabs.filter((t) => t.key !== "home" && t.key !== "collections" && t.key !== "achievements" && t.key !== "myTeam");
  // If current value is hidden, normalize to the first visible tab
  React.useEffect(() => {
    if (!visibleTabs.some((t) => t.key === value) && visibleTabs.length > 0) {
      onChange(visibleTabs[0].key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, visibleTabs.map((t) => t.key).join(",")]);
  const currentIndex = Math.max(0, visibleTabs.findIndex((t) => t.key === value));
  return (
    <Tabs
      value={currentIndex < 0 ? 0 : currentIndex}
      onChange={(_, idx: number) => onChange(visibleTabs[idx].key)}
      variant={isMdUp ? "standard" : "scrollable"}
      centered={isMdUp}
      scrollButtons={isMdUp ? false : "auto"}
      TabIndicatorProps={{
        sx: {
          height: 24,
          borderRadius: 999,
          background:
            "linear-gradient(180deg, color-mix(in oklab, #ffffff, transparent 88%), color-mix(in oklab, var(--primaryLight), transparent 82%))",
          boxShadow: `0 10px 28px -12px var(--shadow)`,
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
      }}
    >
      {visibleTabs.map((t) => (
        <Tab
          key={t.key}
          disableRipple
          label={
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
              <Box component="span" sx={{ fontWeight: 800, fontSize: 11 }}>{t.label}</Box>
              <Box sx={{ fontSize: 0, display: "grid", placeItems: "center" }}>{t.icon}</Box>
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
            position: "relative",
            zIndex: 1,
            transition: "color .2s ease",
            '&.Mui-selected': {
              color: "var(--textPrimary)",
              textShadow: "0 0 12px color-mix(in oklab, var(--highlight), transparent 55%)",
            },
            ':hover': {
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
              background: "linear-gradient(90deg, color-mix(in oklab, var(--primaryLight), transparent 30%), color-mix(in oklab, var(--secondaryLight), transparent 40%))",
              boxShadow: "0 0 12px color-mix(in oklab, var(--highlight), transparent 70%)",
            },
          }}
        />
      ))}
    </Tabs>
  );
}

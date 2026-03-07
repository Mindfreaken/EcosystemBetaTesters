"use client";

import React from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ArrowLeft, Calendar } from "lucide-react";
import { profileModes } from "../tabsConfig";
import { glowPill } from "@/components/ui/glow";

export default function ProfileFilters({
  visible,
  mode,
  onModeChange,
  season,
  onSeasonChange,
  onBack,
}: {
  visible?: boolean;
  mode?: string;
  onModeChange?: (mode: string) => void;
  season?: string;
  onSeasonChange?: (season: string) => void;
  onBack?: () => void;
}) {
  const isMdUp = useMediaQuery("(min-width:900px)");
  if (!visible) return null;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        mt: 0.25,
        pb: 0.25,
        flexWrap: "wrap",
      }}
    >
      {onBack ? (
        <Button
          onClick={onBack}
          startIcon={<ArrowLeft size={16} />}
          size="small"
          variant="outlined"
          sx={{
            borderRadius: 999,
            textTransform: "none",
            fontWeight: 700,
            fontSize: 12,
            px: 1.25,
            py: 0.25,
            color: "color-mix(in oklab, var(--foreground), transparent 10%)",
            borderColor: "color-mix(in oklab, var(--border), transparent 10%)",
            background: "transparent",
            '&:hover': {
              borderColor: "color-mix(in oklab, var(--border), transparent 0%)",
              background: "color-mix(in oklab, var(--card), transparent 80%)",
            },
            ...glowPill(),
          }}
        >
          Back to Leaderboard
        </Button>
      ) : null}

      <Tabs
        value={mode ? profileModes.findIndex((m) => m === mode) : 0}
        onChange={(_, idx: number) => onModeChange?.(profileModes[idx])}
        variant={isMdUp ? "standard" : "scrollable"}
        centered={false}
        scrollButtons={isMdUp ? false : "auto"}
        TabIndicatorProps={{
          sx: {
            height: 28,
            borderRadius: 999,
            background:
              "linear-gradient(180deg, color-mix(in oklab, #ffffff, transparent 90%), color-mix(in oklab, var(--primaryLight), transparent 90%))",
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
        sx={{ minHeight: 34, '.MuiTabs-flexContainer': { gap: 0.5 } }}
      >
        {profileModes.map((m) => (
          <Tab
            key={m}
            disableRipple
            label={<Box component="span" sx={{ fontWeight: 700, fontSize: 12 }}>{m}</Box>}
            disabled={m !== "Ranked Solo"}
            sx={{
              minHeight: 34,
              py: 0.25,
              px: 1,
              color: "color-mix(in oklab, var(--foreground), transparent 30%)",
              textTransform: "none",
              fontSize: 12,
              fontWeight: 700,
              position: "relative",
              zIndex: 1,
              transition: "color .2s ease",
              cursor: m !== "Ranked Solo" ? "not-allowed" : undefined,
              '&.Mui-selected': { color: "var(--textPrimary)" },
              ':hover': { color: "var(--textPrimary)" },
              '&:not(.Mui-selected):hover::after': {
                content: "''",
                position: "absolute",
                left: 8,
                right: 8,
                bottom: 3,
                height: 2,
                borderRadius: 2,
                background: "linear-gradient(90deg, color-mix(in oklab, var(--primaryLight), transparent 30%), color-mix(in oklab, var(--secondaryLight), transparent 40%))",
                boxShadow: "0 0 10px color-mix(in oklab, var(--highlight), transparent 70%)",
              },
            }}
          />
        ))}
      </Tabs>

      <Select
        size="small"
        value={season ?? "Season 2025 3"}
        onChange={(e) => onSeasonChange?.(e.target.value as string)}
        renderValue={(val) => (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ display: 'grid', placeItems: 'center', fontSize: 0 }}>
              <Calendar size={12} />
            </Box>
            <Box component="span" sx={{ fontWeight: 700, fontSize: 11 }}>{val as string}</Box>
          </Box>
        )}
        MenuProps={{
          PaperProps: {
            sx: {
              mt: 0.5,
              borderRadius: 2,
              bgcolor: 'var(--card)',
              color: 'var(--textPrimary)',
              border: '1px solid color-mix(in oklab, var(--border), transparent 20%)',
              boxShadow: '0 12px 30px color-mix(in oklab, var(--shadow), transparent 85%)',
              '& .MuiMenuItem-root': {
                fontWeight: 700,
                fontSize: 11,
              },
              '& .MuiMenuItem-root.Mui-selected': {
                background: 'color-mix(in oklab, var(--primaryLight), transparent 88%)',
              },
              '& .MuiMenuItem-root:hover': {
                background: 'color-mix(in oklab, var(--secondaryLight), transparent 88%)',
              },
            },
          },
        }}
        sx={{
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,
          height: 28,
          color: "color-mix(in oklab, var(--foreground), transparent 10%)",
          borderColor: "color-mix(in oklab, var(--border), transparent 10%)",
          '.MuiOutlinedInput-notchedOutline': { borderColor: "color-mix(in oklab, var(--border), transparent 20%)" },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: "color-mix(in oklab, var(--border), transparent 0%)" },
          '.MuiSelect-select': {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            py: 0.25,
            px: 1,
            lineHeight: 1.1,
          },
          '.MuiSelect-icon': { right: 6, color: 'color-mix(in oklab, var(--foreground), transparent 30%)' },
          background: "transparent",
          ...glowPill(),
        }}
      >
        <MenuItem value="Season 2025 3">Season 2025 3</MenuItem>
        <MenuItem value="Season 2025 2">Season 2025 2</MenuItem>
        <MenuItem value="Season 2025 1">Season 2025 1</MenuItem>
      </Select>
    </Box>
  );
}

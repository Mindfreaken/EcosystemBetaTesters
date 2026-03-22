"use client";
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { Puzzle, Sword, Sparkles } from "lucide-react";
import Typography from "@mui/material/Typography";
import ContentTemplate from "../_shared/ContentTemplate";
import ActionCard from "../_shared/ActionCard";
import { themeVar } from "@/theme/registry";
import NerdleMain from "./main/nerdle/NerdleMain";
import { useShellView } from "../../../viewContext";

const items = [
  {
    id: "nerdle",
    name: "Nerdle",
    icon: <Puzzle size={32} />,
    description: "Daily puzzle challenge. Test your logic and keep your streak alive.",
    color: "primary"
  },
  {
    id: "dungeon-deal",
    name: "Dungeon Deal",
    icon: <Sword size={32} />,
    description: "Deck, delve, and deal your way through roguelike dungeons.",
    color: "secondary"
  },
];

export default function DailiesContent() {
  const { selectedDailyId: selectedId, setSelectedDailyId, setNerdleVariant } = useShellView();
  // Map back to our old object structure for compatibility with existing code
  const selected = items.find(it => it.id === selectedId) || null;
  const setSelected = (val: { id: string; name: string } | null) => {
    setSelectedDailyId(val?.id || null);
    if (val?.id === "nerdle") {
      setNerdleVariant(null);
    }
  };

  // Increment this when the same item is selected again to force a remount of the detail view
  const [selectionNonce, setSelectionNonce] = useState(0);


  return (
    <Box sx={{ flex: 1, height: "100%", display: "flex", flexDirection: "column" }}>
      {!selected ? (
        <ContentTemplate
        >
          <Box sx={{ maxWidth: 1000, mx: "auto", mt: 4 }}>
            {/* Header Section */}
            <Box sx={{ textAlign: "center", mb: 6 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  color: themeVar("foreground"),
                  mb: 2,
                  letterSpacing: "-0.02em",
                  textShadow: `0 0 20px color-mix(in oklab, ${themeVar("primary")}, transparent 70%)`,
                }}
              >
                Dive into your Dailies.
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: themeVar("mutedForeground"),
                  maxWidth: 600,
                  mx: "auto",
                  fontSize: "1.1rem",
                  lineHeight: 1.6,
                }}
              >
                Your daily ritual of gaming and challenge. Stay sharp, compete, and level up every single day.
              </Typography>
            </Box>

            {/* Action Cards */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 4,
                mb: 8,
              }}
            >
              {items.map((item) => (
                <ActionCard
                  key={item.id}
                  title={item.name}
                  description={item.description}
                  icon={item.icon}
                  colorKey={item.color as any}
                  onClick={() => setSelected({ id: item.id, name: item.name })}
                  extraContent={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="caption" sx={{ color: item.id === "nerdle" ? themeVar("chart3") : themeVar("mutedForeground"), fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {item.id === "nerdle" ? "Available Now" : "Coming Soon"}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </Box>
          </Box>
        </ContentTemplate>
      ) : (
        <>
          {/* Main area with header-based navigation */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Inline Header: chips, styled like Shell header extension */}
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: 5,
                px: 2,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                backgroundColor: `color-mix(in oklab, ${themeVar("background")}, transparent 8%)`,
                backdropFilter: 'blur(12px)',
                borderBottom: `1px solid ${themeVar("border")}`,
                minHeight: 56
              }}
            >
              <Button
                variant="text"
                onClick={() => setSelected(null)}
                startIcon={<span style={{ fontWeight: 900 }}>←</span>}
                sx={{
                  color: themeVar("mutedForeground"),
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  px: 2,
                  "&:hover": { color: themeVar("foreground"), bgcolor: `color-mix(in oklab, ${themeVar("foreground")}, transparent 95%)` }
                }}
              >
                Back
              </Button>

              <Box sx={{ width: "1px", height: 24, bgcolor: themeVar("border"), mx: 0.5, opacity: 0.5 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
                {items.map((it) => {
                  const active = selected?.id === it.id;
                  const activeColor = themeVar(it.color as any);
                  const isAvailable = it.id === "nerdle";

                  return (
                    <Button
                      key={it.id}
                      disabled={!isAvailable}
                      onClick={() => {
                        if (selected?.id === it.id) {
                          setSelectionNonce((n: number) => n + 1);
                        }
                        setSelected({ id: it.id, name: it.name });
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 2,
                        py: 0.75,
                        minWidth: 'auto',
                        borderRadius: "8px",
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        backgroundColor: active ? `color-mix(in oklab, ${activeColor}, transparent 85%)` : 'transparent',
                        color: active ? activeColor : themeVar("mutedForeground"),
                        border: `1px solid ${active ? activeColor : "transparent"}`,
                        "&.Mui-disabled": { opacity: 0.4, cursor: "not-allowed" },
                        "&:hover": {
                          backgroundColor: active ? `color-mix(in oklab, ${activeColor}, transparent 80%)` : `color-mix(in oklab, ${themeVar("foreground")}, transparent 97%)`,
                          borderColor: active ? activeColor : themeVar("border"),
                        },
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: active ? `0 0 12px color-mix(in oklab, ${activeColor}, transparent 85%)` : 'none',
                      }}
                    >
                      {React.cloneElement(it.icon as any, { size: 14 })}
                      {it.name}
                    </Button>
                  );
                })}
              </Box>
            </Box>
            {/* Detail/Play area */}
            {selected && (selected.id === "nerdle" ? (
              <NerdleMain key={`nerdle-${selectionNonce}`} />
            ) : null)}
          </Box>
        </>
      )}
    </Box>
  );
}




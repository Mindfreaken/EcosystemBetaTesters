"use client";
import React, { useState } from "react";
import Box from "@mui/material/Box";
import { Puzzle, Sword, Sparkles } from "lucide-react";
import Typography from "@mui/material/Typography";
import ContentTemplate from "../_shared/ContentTemplate";
import ActionCard from "../_shared/ActionCard";
import { themeVar } from "@/theme/registry";
import NerdleMain from "./main/nerdle/NerdleMain";

export default function DailiesContent() {
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(
    null
  );
  // Increment this when the same item is selected again to force a remount of the detail view
  const [selectionNonce, setSelectionNonce] = useState(0);

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
                  color: themeVar("textLight"),
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
                  color: themeVar("textSecondary"),
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
                      <Sparkles size={16} style={{ color: themeVar("highlight") }} />
                      <Typography variant="caption" sx={{ color: themeVar("textSecondary"), fontWeight: 600 }}>
                        Available Now
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
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                overflowX: 'auto',
                backgroundColor: `color-mix(in oklab, ${themeVar("background")}, transparent 5%)`,
                backdropFilter: 'blur(10px)',
                borderBottom: `1px solid ${themeVar("border")}`,
              }}
            >
              <button
                onClick={() => setSelected(null)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: `1px solid ${themeVar("border")}`,
                  background: 'transparent',
                  color: themeVar("textSecondary"),
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = themeVar("highlight");
                  e.currentTarget.style.color = themeVar("textLight");
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = themeVar("border");
                  e.currentTarget.style.color = themeVar("textSecondary");
                }}
              >
                ← Back
              </button>
              <Box sx={{ width: 1, height: 20, bgcolor: themeVar("border"), mx: 1 }} />
              {items.map((it) => {
                const active = selected?.id === it.id;
                const activeColor = themeVar(it.color as any);
                return (
                  <button
                    key={it.id}
                    onClick={() => {
                      if (selected?.id === it.id) {
                        setSelectionNonce((n: number) => n + 1);
                      }
                      setSelected({ id: it.id, name: it.name });
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      border: `1px solid ${active ? activeColor : themeVar("border")}`,
                      background: active ? `color-mix(in oklab, ${activeColor}, transparent 90%)` : 'transparent',
                      color: active ? activeColor : themeVar("textSecondary"),
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: active ? `0 0 15px color-mix(in oklab, ${activeColor}, transparent 80%)` : 'none',
                    }}
                  >
                    <span style={{ display: 'grid', placeItems: 'center', opacity: active ? 1 : 0.6 }}>
                      {React.cloneElement(it.icon as any, { size: 16 })}
                    </span>
                    <span>{it.name.toUpperCase()}</span>
                  </button>
                );
              })}
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


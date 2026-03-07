"use client";

import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Shield, Pickaxe, Trophy } from "lucide-react";
import NerdleGameBoard from "./NerdleGameBoard";
import LeaderboardModal from "./LeaderboardModal";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import ContentTemplate from "../../../_shared/ContentTemplate";
import ActionCard from "../../../_shared/ActionCard";
import { themeVar } from "@/theme/registry";

// Nerdle variants
type NerdleVariant = "valorant" | "minecraft";

export default function NerdleMain() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [variant, setVariant] = useState<NerdleVariant | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  const [todayLocal, setTodayLocal] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [nextLocalMidnight, setNextLocalMidnight] = useState<number>(() => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    return next.getTime();
  });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      setTodayLocal(`${y}-${m}-${d}`);
      const next = new Date(now);
      next.setHours(24, 0, 0, 0);
      setNextLocalMidnight(next.getTime());
    };
    update();
    const id = window.setInterval(update, 30 * 1000);
    return () => window.clearInterval(id);
  }, []);

  const current = useQuery(
    api.dailies.nerdle.current.getByDate,
    variant ? { game: variant, date: todayLocal } : "skip"
  );

  const [activeSchedule, setActiveSchedule] = useState<null | { displayName: string; wordId: number }>(null);
  useEffect(() => {
    if (current && typeof current.wordId === "number") {
      setActiveSchedule({ displayName: current.displayName, wordId: current.wordId });
    }
  }, [current]);

  const backfill = useMutation(api.dailies.nerdle.plays.backfillDNFs);
  useEffect(() => {
    if (!variant) return;
    void backfill({ today: todayLocal }).catch(() => { });
  }, [variant, todayLocal, backfill]);

  return (
    <Box sx={{ flex: 1, height: "100%", display: "flex", flexDirection: "column" }}>
      {!variant ? (
        <ContentTemplate
          title="Nerdle"
          subtitle="Choose a themed word puzzle to begin your daily challenge."
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
                Choose your Nerdle.
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
                Pick a themed word puzzle to begin. Agents, mobs, maps, or blocks—your logic is the key to victory.
              </Typography>
            </Box>

            {/* Variant Cards */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 4,
                mb: 4,
              }}
            >
              {[
                {
                  id: "valorant",
                  name: "Valorant",
                  icon: <Shield />,
                  color: "primary",
                  description: "Agents, maps, and meta—word guesses in a tactical universe.",
                },
                {
                  id: "minecraft",
                  name: "Minecraft",
                  icon: <Pickaxe />,
                  color: "secondary",
                  description: "Mobs, biomes, and blocks—craft the correct word.",
                },
              ].map((item) => (
                <ActionCard
                  key={item.id}
                  title={item.name}
                  description={item.description}
                  icon={item.icon}
                  colorKey={item.color as any}
                  onClick={() => setVariant(item.id as NerdleVariant)}
                />
              ))}
            </Box>

            {/* Leaderboard Card */}
            <ActionCard
              title="Global Leaderboard"
              description="See how you stack up this season across all variants."
              icon={<Trophy />}
              colorKey="highlight"
              onClick={() => setLeaderboardOpen(true)}
              extraContent={
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.6, letterSpacing: 1 }}>VIEW RANKINGS &rarr;</Typography>
                </Box>
              }
            />
          </Box>
        </ContentTemplate>
      ) : (
        // Single main area with the gameboard; outer Games sidebar remains the only sidebar
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {variant && activeSchedule && (
            <NerdleGameBoard
              puzzle={{
                answer: activeSchedule.displayName,
                category: variant === "valorant" ? "Valorant" : "Minecraft",
              }}
              baseGuesses={6}
              themeColor={variant === "valorant" ? "primary" : "secondary"}
              nextRolloverAt={nextLocalMidnight}
              game={variant}
              date={todayLocal}
              wordId={activeSchedule.wordId}
            />
          )}
        </Box>
      )}
      {/* Leaderboard Modal */}
      <LeaderboardModal open={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} game="valorant" />
    </Box>
  );
}

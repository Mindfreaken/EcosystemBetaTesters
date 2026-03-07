"use client";

import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
// Convex removed in mock-only mode
import type { RoleKey } from "./utils";

export default function Last50Summary({
  region,
  queue,
  puuid,
  role = "all" as RoleKey | "all",
}: {
  region: string;
  queue: string; // e.g., "RANKED_SOLO_5x5"
  puuid?: string;
  role?: RoleKey | "all";
}) {
  const normalizedRegion = React.useMemo(() => region.toLowerCase(), [region]);

  // Determine target player (mock): use provided puuid or derive one deterministically
  const target = React.useMemo(() => {
    if (puuid) return { puuid } as const;
    const seedStr = `${normalizedRegion}-${queue}-${role}-top`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
    const mockPuuid = `mock-${hash.toString(16).padStart(8, '0')}`;
    return { puuid: mockPuuid } as const;
  }, [puuid, normalizedRegion, queue, role]);

  // Derive a single, cohesive recent match count shared across trackers (range 30..50)
  const recentCount = React.useMemo(() => {
    const seedStr = `${normalizedRegion}-${queue}-${target.puuid}-recentCount`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
    return 30 + (hash % 21);
  }, [normalizedRegion, queue, target.puuid]);

  // Generate deterministic mock participants (up to 50)
  const participants = React.useMemo(() => {
    const seedStr = `${normalizedRegion}-${queue}-${role}-${target.puuid}-recent`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
    const count = recentCount; // ensure cohesion with other trackers
    const arr: any[] = [];
    for (let i = 0; i < count; i++) {
      // advance hash
      hash = (hash * 1664525 + 1013904223) >>> 0;
      const r01 = (hash & 0xffff) / 0xffff;
      const win = (hash % 3) !== 0; // ~66% win for variety
      const gpm = Math.round(300 + r01 * 400); // 300..700
      hash = (hash * 1664525 + 1013904223) >>> 0;
      const dpm = Math.round(250 + ((hash & 0xffff) / 0xffff) * 900); // 250..1150
      hash = (hash * 1664525 + 1013904223) >>> 0;
      const kda = Number((1 + ((hash & 0xffff) / 0xffff) * 5).toFixed(2)); // 1..6
      const vision = Math.round(10 + ((hash >>> 8) & 0xffff) / 0xffff * 45); // 10..55
      const wardsPlaced = Math.round(5 + ((hash >>> 4) & 0xffff) / 0xffff * 10); // 5..15
      const wardsCleared = Math.round(2 + ((hash >>> 2) & 0xffff) / 0xffff * 6); // 2..8
      const firstBloodKill = ((hash >>> 12) % 5) === 0; // ~20%
      arr.push({
        win,
        goldPerMinuteComputed: gpm,
        damagePerMinuteComputed: dpm,
        kdaComputed: kda,
        visionScore: vision,
        wardsPlaced,
        wardsKilled: wardsCleared,
        firstBloodKill,
      });
    }
    return arr;
  }, [normalizedRegion, queue, target.puuid, recentCount, role]);

  const loading = false;
  const empty = participants.length === 0;

  const stats = React.useMemo(() => {
    if (!participants || participants.length === 0) return null;
    // Rows are ascending by time; last element is most recent
    const rows = participants;
    const n = rows.length;
    const wins = rows.reduce((acc, r: any) => acc + (r.win ? 1 : 0), 0);
    const losses = n - wins;

    // Current streak from most recent backwards
    let streakCount = 0;
    let streakSign: "+" | "-" = "+";
    if (n > 0) {
      const lastIsWin = Boolean(rows[n - 1].win);
      streakSign = lastIsWin ? "+" : "-";
      for (let i = n - 1; i >= 0; i--) {
        if (Boolean(rows[i].win) === lastIsWin) streakCount++;
        else break;
      }
    }

    const safeAvg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    const avgGpm = Math.round(safeAvg(rows.map((r: any) => Number(r.goldPerMinuteComputed || r.goldPerMinute || 0))));
    const avgDpm = Math.round(safeAvg(rows.map((r: any) => Number(r.damagePerMinuteComputed || r.damagePerMinute || 0))));
    const avgKda = safeAvg(rows.map((r: any) => Number(r.kdaComputed || 0)));
    const avgVision = Math.round(safeAvg(rows.map((r: any) => Number(r.visionScore || 0))));
    const wardsPlaced = safeAvg(rows.map((r: any) => Number(r.wardsPlaced || 0)));
    const wardsCleared = safeAvg(rows.map((r: any) => Number(r.wardsKilled || r.wardTakedowns || 0)));
    const firstBloodRate = safeAvg(rows.map((r: any) => (r.firstBloodKill ? 1 : 0)));

    return {
      n,
      wins,
      losses,
      streak: `${streakSign}${streakCount}`,
      avgGpm,
      avgDpm,
      avgKda,
      avgVision,
      wardsPlaced,
      wardsCleared,
      firstBloodRate,
    } as const;
  }, [participants]);

  return (
    <Paper elevation={0} sx={{ ...cardSx, p: 1.25, height: '100%' }}>
      {loading ? (
        <Typography variant="body2" sx={{ color: 'var(--textSecondary)' }}>Loading last matches…</Typography>
      ) : empty || !stats ? (
        <Typography variant="body2" sx={{ color: 'var(--textSecondary)' }}>No recent ranked matches.</Typography>
      ) : (
        <>
          <Typography variant="subtitle2" sx={sectionLabelSx}>Last {stats.n} Matches</Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(3, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
                lg: "repeat(6, minmax(0, 1fr))",
              },
              gap: 1.25,
              mt: 0.5,
            }}
          >
            <StatPill label="Win Rate" value={`${((stats.wins / Math.max(1, (stats.wins + stats.losses))) * 100).toFixed(1)}%`} />
            <StatPill label="Record" value={`${stats.wins}-${stats.losses}`} />
            <StatPill label="Streak" value={stats.streak} color={stats.streak.startsWith("-") ? "#ff6b6b" : "#18c964"} />
            <StatPill label="Avg GPM" value={`${stats.avgGpm}`} />
            <StatPill label="Avg DPM" value={`${stats.avgDpm}`} />
            <StatPill label="Avg KDA" value={`${stats.avgKda.toFixed(1)}`} />
            <StatPill label="Avg Vision" value={`${stats.avgVision}`} />
            <StatPill label="Wards Placed" value={`${stats.wardsPlaced.toFixed(1)}`} />
            <StatPill label="Wards Cleared" value={`${stats.wardsCleared.toFixed(1)}`} />
            <StatPill label="First Blood Rate" value={`${(stats.firstBloodRate * 100).toFixed(0)}%`} />
          </Box>
        </>
      )}
    </Paper>
  );
}

const cardSx = {
  p: 2,
  borderRadius: 2,
  border: "1px solid color-mix(in oklab, var(--border), transparent 30%)",
  backgroundColor: "var(--card)",
} as const;

const dividerColor = "color-mix(in oklab, var(--border), transparent 50%)";
const sectionLabelSx = { fontWeight: 900, color: "var(--textLight)", letterSpacing: 0.3 } as const;

function StatPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <Typography variant="caption" sx={{ color: "var(--textSecondary)", fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.1 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 900, color: color ?? "var(--textPrimary)", fontSize: '0.95rem', lineHeight: 1.1 }}>
        {value}
      </Typography>
    </Box>
  );
}

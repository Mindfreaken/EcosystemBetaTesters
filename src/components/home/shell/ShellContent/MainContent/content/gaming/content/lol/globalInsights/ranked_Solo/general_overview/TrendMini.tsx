import React from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { chipNeutralSx } from "./styles";
// Convex removed for mock-only mode

import type { RoleKey } from "./utils";
import { ROLE_STAT_MULTIPLIERS } from "../shared/rolesMock";

export default function TrendMini({ region, queue, puuid, role = "all" as RoleKey | "all", onCount }: { region: string; queue: string; puuid?: string; role?: RoleKey | "all"; onCount?: (n: number) => void }) {
  const winColor = "#18c964";
  const lossColor = "#ff6b6b";

  const normalizedRegion = React.useMemo(() => region.toLowerCase(), [region]);
  // Determine target PUUID in mock mode
  const target = React.useMemo(() => {
    if (puuid) return { puuid } as const;
    const seedStr = `${normalizedRegion}-${queue}-${role}-top`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
    return { puuid: `mock-${hash.toString(16).padStart(8, '0')}` } as const;
  }, [puuid, normalizedRegion, queue, role]);

  // Cohesive recent match count shared across trackers (30..50)
  const recentCount = React.useMemo(() => {
    const seedStr = `${normalizedRegion}-${queue}-${role}-${target.puuid}-recentCount`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
    return 30 + (hash % 21);
  }, [normalizedRegion, queue, target.puuid, role]);

  // Generate deterministic mock W/L sequence (up to 50), oldest -> newest
  const data = React.useMemo<("W" | "L")[] | null>(() => {
    const seedStr = `${normalizedRegion}-${queue}-${role}-${target.puuid}-trend`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
    const count = recentCount; // ensure cohesion with other trackers
    const arr: ("W" | "L")[] = [];
    const mult = (ROLE_STAT_MULTIPLIERS as any)[role as RoleKey] ?? { winBias: 0 };
    for (let i = 0; i < count; i++) {
      hash = (hash * 1664525 + 1013904223) >>> 0;
      const r01 = (hash & 0xffff) / 0xffff;
      const baseWin = 0.66 + (mult.winBias ?? 0);
      const win = r01 < Math.max(0.05, Math.min(0.95, baseWin));
      arr.push(win ? "W" : "L");
    }
    return arr;
  }, [normalizedRegion, queue, target.puuid, recentCount, role]);

  // Report count to parent
  React.useEffect(() => {
    if (onCount) onCount(Array.isArray(data) ? data.length : 0);
  }, [data, onCount]);

  const wins = data ? data.filter((d) => d === "W").length : 0;
  const wr = data ? ((wins / Math.max(1, data.length)) * 100).toFixed(1) : "0.0";

  if (!data) {
    return (
      <Box>
        <Typography variant="caption" sx={{ color: "var(--muted-foreground)" }}>No trend data.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${data.length}, 1fr)`, columnGap: 0.5, alignItems: 'end', height: 32, mt: 0.5 }}>
        {data.map((r, i) => (
          <Box
            key={i}
            sx={{
              width: '100%',
              height: 8 + (r === "W" ? 18 : 6),
              backgroundColor: r === "W" ? `${winColor}66` : `${lossColor}66`,
              border: `1px solid ${r === "W" ? `${winColor}99` : `${lossColor}99`}`,
              borderRadius: 0.75,
              boxShadow: r === "W" ? `0 0 6px ${winColor}33` : `0 0 6px ${lossColor}33`,
            }}
            title={r === "W" ? "Win" : "Loss"}
          />
        ))}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
        <Chip size="small" label={`WR ${wr}%`} sx={chipNeutralSx} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LegendSwatch color={winColor} label="Win" />
          <LegendSwatch color={lossColor} label="Loss" />
        </Box>
      </Box>
    </Box>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Box sx={{ width: 10, height: 10, borderRadius: 0.75, backgroundColor: `${color}66`, border: `1px solid ${color}99` }} />
      <Typography variant="caption" sx={{ color: "var(--muted-foreground)" }}>{label}</Typography>
    </Box>
  );
}



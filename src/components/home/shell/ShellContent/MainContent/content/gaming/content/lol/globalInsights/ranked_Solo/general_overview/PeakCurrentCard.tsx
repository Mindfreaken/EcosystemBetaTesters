"use client";

import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
// Convex removed for mock-only mode

export type PeakCurrentCardProps =
  | {
      // Fetch mode
      region: string;
      queue: string;
      puuid?: string;
      peak?: never;
      current?: never;
    }
  | {
      // Legacy/manual mode
      peak: { tier: string; lp: number; badgeText?: string };
      current: { tier: string; lp: number; delta7d?: number };
      region?: never;
      queue?: never;
      puuid?: never;
    };

export default function PeakCurrentCard(props: PeakCurrentCardProps) {
  const isFetchMode = (p: PeakCurrentCardProps): p is Extract<PeakCurrentCardProps, { region: string }> =>
    (p as any).region !== undefined && (p as any).queue !== undefined;

  // Data from either props or Convex
  const { uiPeak, uiCurrent, loading, empty } = usePeakCurrentData(props, isFetchMode(props));

  return (
    <Paper elevation={0} sx={{ ...cardSx, p: 1.25, height: '100%', width: { xs: '100%', md: 'auto' } }}>
      {loading ? (
        <Typography variant="body2" sx={{ color: 'var(--muted-foreground)' }}>Loading…</Typography>
      ) : empty || !uiPeak || !uiCurrent ? (
        <Typography variant="body2" sx={{ color: 'var(--muted-foreground)' }}>No data.</Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.25 }}>
          <MetaItem label="Peak" iconSrc={`/league/emblems/emblem_${uiPeak.tier}.svg`} iconAlt="peak badge">
            <Typography sx={{ fontWeight: 900, color: 'var(--foreground)', fontSize: '0.95rem', lineHeight: 1.1 }}>
              {uiPeak.tier} {uiPeak.lp} LP
            </Typography>
          </MetaItem>
          <MetaItem label="Current" iconSrc={`/league/emblems/emblem_${uiCurrent.tier}.svg`} iconAlt="current badge">
            <Typography sx={{ fontWeight: 900, color: 'var(--foreground)', fontSize: '0.95rem', lineHeight: 1.1 }}>
              {uiCurrent.tier} {uiCurrent.lp} LP
            </Typography>
          </MetaItem>
        </Box>
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

function MetaItem({ label, iconSrc, iconAlt, children }: { label: string; iconSrc?: string; iconAlt?: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'var(--muted-foreground)', lineHeight: 1.1, fontWeight: 700, fontSize: '0.95rem' }}>{label}</Typography>
          {iconSrc ? (
            <Box component="img" src={iconSrc} alt={iconAlt ?? label} sx={{ width: 20, height: 20 }} />
          ) : null}
        </Box>
        <Box sx={{ mt: 0.25 }}>{children}</Box>
      </Box>
    </Box>
  );
}

// Hook to provide peak/current from either props or Convex
function usePeakCurrentData(props: PeakCurrentCardProps, fetchMode: boolean) {
  // Legacy/manual mode: map directly
  if (!fetchMode) {
    const p = props as Extract<PeakCurrentCardProps, { peak: any; current: any }>;
    return {
      uiPeak: p.peak,
      uiCurrent: p.current,
      loading: false,
      empty: !p.peak || !p.current,
    } as const;
  }

  // Mock mode: generate deterministic current/peak from inputs
  const { region, queue, puuid } = props as Extract<PeakCurrentCardProps, { region: string; queue: string; puuid?: string }>;
  const normalizedRegion = React.useMemo(() => region.toLowerCase(), [region]);

  const ui = React.useMemo(() => {
    const seedStr = `${normalizedRegion}-${queue}-${puuid ?? "top"}`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
    const tiers = ["diamond", "master", "grandmaster", "challenger"] as const;
    const tier = tiers[hash % tiers.length];
    const base = 3600 + (hash % 900); // 3600-4499
    const delta = (hash % 120) - 60; // -60..+59
    const currentLP = base + Math.max(-40, Math.min(40, delta));
    const peakLP = Math.max(currentLP, base + 80);
    const uiCurrent = { tier, lp: currentLP };
    const uiPeak = { tier, lp: peakLP };
    return { uiPeak, uiCurrent } as const;
  }, [normalizedRegion, queue, puuid]);

  return { ...ui, loading: false, empty: false } as const;
}



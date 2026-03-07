"use client"

import React from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Paper from "@mui/material/Paper"
import Chip from "@mui/material/Chip"
import PredictionBadge from "../../../../_shared/prediction-badge"
import PerformanceScore from "../../../../_shared/performance-score" // Updated import to use new component
// Convex removed for mock-only mode
import Tooltip from "@mui/material/Tooltip"
import type { RoleKey } from "./utils"
import { getChampPoolForRole, ROLE_STAT_MULTIPLIERS } from "../shared/rolesMock"

// Local styles/utilities for the Recent Matches strip
const dividerColor = "color-mix(in oklab, var(--border), transparent 50%)"
const chipNeutralSx = {
  height: 24,
  color: "var(--textPrimary)",
  borderColor: "color-mix(in oklab, var(--border), transparent 35%)",
  backgroundColor: "transparent",
  border: "1px solid",
  fontWeight: 800,
} as const

// Minimal rune ID -> asset/name mapping to support mock data and common runes
// Keystone ids (examples): 8010 Conqueror, 8214 Summon Aery, 8439 Aftershock, 8021 Fleet Footwork, 8005 Press the Attack
// Tree ids: 8000 Precision, 8200 Sorcery, 8400 Resolve, 8100 Domination, 8300 Inspiration
const RUNE_KEYSTONES: Record<number, { file: string; name: string }> = {
  8010: { file: "Conqueror.png", name: "Conqueror" },
  8214: { file: "SummonAery.png", name: "Summon Aery" },
  8439: { file: "VeteranAftershock.png", name: "Aftershock" },
  8005: { file: "PressTheAttack.png", name: "Press the Attack" },
  8021: { file: "FleetFootwork.png", name: "Fleet Footwork" },
  8112: { file: "Electrocute.png", name: "Electrocute" },
  8369: { file: "FirstStrike.png", name: "First Strike" },
}

const RUNE_TREES: Record<number, { file: string; name: string }> = {
  8000: { file: "7201_Precision.png", name: "Precision" },
  8100: { file: "7200_Domination.png", name: "Domination" },
  8200: { file: "7202_Sorcery.png", name: "Sorcery" },
  8300: { file: "7203_Whimsy.png", name: "Inspiration" },
  8400: { file: "7204_Resolve.png", name: "Resolve" },
}

function runeIconPath(id: number) {
  const k = RUNE_KEYSTONES[id]
  if (k) return `/league/runes/${k.file}`
  const t = RUNE_TREES[id]
  if (t) return `/league/runes/${t.file}`
  // Fallback to numeric asset if present
  return `/league/runes/${id}.png`
}

function runeName(id: number) {
  return RUNE_KEYSTONES[id]?.name || RUNE_TREES[id]?.name || `Rune ${id}`
}

// Summoner spell id -> asset/name mapping (core spells)
const SPELLS: Record<number, { file: string; name: string }> = {
  1: { file: "SummonerBoost.png", name: "Cleanse" },
  3: { file: "SummonerExhaust.png", name: "Exhaust" },
  4: { file: "SummonerFlash.png", name: "Flash" },
  6: { file: "SummonerHaste.png", name: "Ghost" },
  7: { file: "SummonerHeal.png", name: "Heal" },
  11: { file: "SummonerSmite.png", name: "Smite" },
  12: { file: "SummonerTeleport.png", name: "Teleport" },
  13: { file: "SummonerMana.png", name: "Clarity" },
  14: { file: "SummonerDot.png", name: "Ignite" },
  21: { file: "SummonerBarrier.png", name: "Barrier" },
}

function spellIconPath(id: number) {
  const s = SPELLS[id]
  return s ? `/league/spells/${s.file}` : `/league/spells/${id}.png`
}

function spellName(id: number) {
  return SPELLS[id]?.name || `Spell ${id}`
}

// Simplified match row type we can fill from participant table and minimal match info
type Match = {
  id: string
  timestamp: number // ms
  queue: string
  durationSec?: number
  result: "W" | "L"
  champ: { name: string; items?: (number | null)[] }
  spells?: [number, number]
  runes?: [number, number]
  k: number
  d: number
  a: number
  cs?: number // total CS, if available
  gpm?: number
  dpm?: number
  vision?: number
  objDmg?: number
  allies?: string[]
  enemies?: string[]
}

// Mock prediction and performance scores by match id (replace with real data later)
const mockPredictionByMatch: Record<string, boolean> = {
  m1: false,
  m2: true,
  m3: false,
}

const mockScoreByMatch: Record<string, number> = {
  m1: 8450,
  m2: 9120,
  m3: 2750,
}

// Map lowercase champion ids to correct asset filenames in public/league/champions/
const CHAMP_ASSET_EXCEPTIONS: Record<string, string> = {
  aurelionsol: "AurelionSol",
  belveth: "Belveth",
  chogath: "Chogath",
  drmundo: "DrMundo",
  jarvaniv: "JarvanIV",
  kaisa: "Kaisa",
  kogmaw: "KogMaw",
  ksante: "KSante",
  leblanc: "Leblanc",
  masteryi: "MasterYi",
  missfortune: "MissFortune",
  monkeyking: "MonkeyKing",
  reksai: "RekSai",
  tahmkench: "TahmKench",
  twistedfate: "TwistedFate",
  velkoz: "Velkoz",
  xinzhao: "XinZhao",
};

function championAssetName(id: string): string {
  const raw = String(id || "").toLowerCase().replace(/[^a-z]/g, "");
  const mapped = CHAMP_ASSET_EXCEPTIONS[raw];
  if (mapped) return mapped;
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Unknown";
}

// Compute simple per-champion averages across the recent matches shown here.
// In real data, replace with user historical averages on that champion.
type ChampAverages = Record<string, { csPerMin: number; gpm: number; dpm: number; vision: number; objDmg: number }>
function computeChampionAverages(matches: Match[]): ChampAverages {
  const agg: Record<string, { cs: number; minutes: number; gpm: number[]; dpm: number[]; vision: number[]; objDmg: number[] }> = {}
  for (const m of matches) {
    const key = m.champ.name
    if (!agg[key]) agg[key] = { cs: 0, minutes: 0, gpm: [], dpm: [], vision: [], objDmg: [] }
    agg[key].cs += m.cs ?? 0
    agg[key].minutes += Math.max(1, (m.durationSec ?? 0) / 60)
    agg[key].gpm.push(m.gpm ?? 0)
    agg[key].dpm.push(m.dpm ?? 0)
    agg[key].vision.push(m.vision ?? 0)
    agg[key].objDmg.push(m.objDmg ?? 0)
  }
  const out: ChampAverages = {}
  for (const [key, a] of Object.entries(agg)) {
    out[key] = {
      csPerMin: a.cs / a.minutes,
      gpm: average(a.gpm),
      dpm: average(a.dpm),
      vision: average(a.vision),
      objDmg: average(a.objDmg),
    }
  }
  return out
}

// Explicit mock champion averages for this demo. These override the computed values above.
const mockChampionAverages: ChampAverages = {
  riven: { csPerMin: 7.2, gpm: 490, dpm: 720, vision: 15, objDmg: 4000 },
  ahri: { csPerMin: 7.0, gpm: 480, dpm: 680, vision: 12, objDmg: 2600 },
  amumu: { csPerMin: 5.5, gpm: 420, dpm: 300, vision: 18, objDmg: 2100 },
}

// Final map used by UI for comparisons; will compute from fetched rows on the fly, then overlay mockChampionAverages.

export default function RecentMatches({ region, queue, puuid, role = "all" as RoleKey | "all" }: { region: string; queue: string; puuid?: string; role?: RoleKey | "all" }) {
  const normalizedRegion = React.useMemo(() => region.toLowerCase(), [region])
  // Determine target PUUID in mock mode
  const target = React.useMemo(() => {
    if (puuid) return { puuid } as const
    const seedStr = `${normalizedRegion}-${queue}-${role}-top`
    let hash = 0
    for (let i = 0; i < seedStr.length; i++) hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0
    return { puuid: `mock-${hash.toString(16).padStart(8, '0')}` } as const
  }, [puuid, normalizedRegion, queue, role])

  // Cohesive recent match count shared across trackers (30..50)
  const recentCount = React.useMemo(() => {
    const seedStr = `${normalizedRegion}-${queue}-${role}-${target.puuid}-recentCount`
    let hash = 0
    for (let i = 0; i < seedStr.length; i++) hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0
    return 30 + (hash % 21)
  }, [normalizedRegion, queue, target.puuid, role])

  // Generate deterministic mock matches (12..20)
  const matches: Match[] | null = React.useMemo(() => {
    const seedStr = `${normalizedRegion}-${queue}-${role}-${target.puuid}-cards`
    let hash = 0
    for (let i = 0; i < seedStr.length; i++) hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0
    const count = recentCount // ensure cohesion with other trackers
    const pool = getChampPoolForRole(role)
    const champs = pool.length ? pool : ["riven", "ahri", "amumu", "lux", "yasuo", "fiora", "vi", "ashe", "vayne", "zyra"]
    const itemsPool = [1038, 6673, 3153, 3072, 3031, 3046, 6333, 3074, 6692, 6671, 6691, 6693, 3006, 3111, 3020, 3118, 3026, 3053]
    const out: Match[] = []
    const now = Date.now()
    for (let i = 0; i < count; i++) {
      hash = (hash * 1664525 + 1013904223) >>> 0
      const champ = champs[hash % champs.length]
      const duration = 1500 + (hash % 1200) // 25m..45m
      // role multipliers and win bias
      const mult = (ROLE_STAT_MULTIPLIERS as any)[role as RoleKey] ?? { csPerMin: 1, gpm: 1, dpm: 1, vision: 1, objDmg: 1, winBias: 0 }
      const r01 = (hash & 0xffff) / 0xffff
      const baseWin = 0.66 + (mult.winBias ?? 0)
      const win = r01 < Math.max(0.05, Math.min(0.95, baseWin))
      const k = (hash % 12)
      hash = (hash * 1664525 + 1013904223) >>> 0
      const d = (hash % 10)
      const a = (hash % 16)
      let cs = 120 + (hash % 220)
      let gpm = 350 + (hash % 250)
      let dpm = 300 + (hash % 900)
      let vision = 10 + (hash % 35)
      let objDmg = 1000 + (hash % 7000)
      // apply role shaping (approximate cs/min by scaling cs)
      cs = Math.round(cs * mult.csPerMin)
      gpm = Math.round(gpm * mult.gpm)
      dpm = Math.round(dpm * mult.dpm)
      vision = Math.round(vision * mult.vision)
      objDmg = Math.round(objDmg * mult.objDmg)
      const pickItems = () => Array.from({ length: 7 }, (_, idx) => (idx < 6 ? itemsPool[(hash + idx * 37) % itemsPool.length] : 3364))
      const timestamp = now - (i * (60 * 60 * 1000) + (hash % (30 * 60 * 1000)))
      out.push({
        id: `m${i + 1}`,
        timestamp,
        queue: "Ranked Solo",
        durationSec: duration,
        result: win ? "W" : "L",
        k, d, a,
        cs,
        gpm,
        dpm,
        vision,
        objDmg,
        champ: { name: champ, items: pickItems() as (number | null)[] },
        spells: [4, (hash % 2 ? 14 : 12)] as [number, number],
        runes: [8010, 8000] as [number, number],
        allies: ["ahri", "amumu", "lux", "ashe", "vi"].slice(0, 5),
        enemies: ["yasuo", "fiora", "vayne", "zyra", "riven"].slice(0, 5),
      })
    }
    // Sort newest first
    out.sort((a, b) => b.timestamp - a.timestamp)
    return out
  }, [normalizedRegion, queue, target.puuid, recentCount, role])

  const loading = false
  const empty = !matches || matches.length === 0

  // CHAMPION averages: use global mock where available; fallback to per-champion averages from shown matches
  const champAvg: ChampAverages = React.useMemo(() => {
    const base = matches ? computeChampionAverages(matches.filter((m) => m.cs && m.gpm && m.dpm && m.vision) as any) : {}
    return { ...(base as any), ...mockChampionAverages }
  }, [matches])

  if (loading) {
    return <Typography variant="body2" sx={{ color: "var(--textSecondary)", mt: 1 }}>Loading recent matches…</Typography>
  }
  if (empty || !matches) {
    return <Typography variant="body2" sx={{ color: "var(--textSecondary)", mt: 1 }}>No recent ranked matches.</Typography>
  }

  const groups = groupByDay(matches)
  return (
    <Box sx={{ mt: 1 }}>
      {groups.map((g) => (
        <Box key={g.key} sx={{ mb: 1.25 }}>
          <GroupHeader
            dayLabel={g.label}
            count={g.items.length}
            wl={{
              w: g.items.filter((m) => m.result === "W").length,
              l: g.items.filter((m) => m.result === "L").length,
            }}
            avg={{
              dpm: average(g.items.map((m) => m.dpm || 0)),
              kda: average(g.items.map((m) => kdaOf(m.k, m.d, m.a))),
              gpm: average(g.items.map((m) => m.gpm || 0)),
            }}
          />
          <Box sx={{ display: "grid", gap: 0.75 }}>
            {g.items.map((m) => (
              <MatchRow key={m.id} m={m} champAvg={champAvg} />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

function GroupHeader({
  dayLabel,
  count,
  wl,
  avg,
}: { dayLabel: string; count: number; wl: { w: number; l: number }; avg: { dpm: number; kda: number; gpm: number } }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        gap: 1.5,
        px: 1.5,
        py: 1,
        mb: 0.75,
        border: `1px solid ${dividerColor}`,
        borderRadius: 1.5,
        backgroundColor: "var(--card)",
        boxShadow: `inset 0 -1px ${dividerColor}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Typography variant="body2" sx={{ color: "var(--textLight)", fontWeight: 900, fontSize: 18 }}>
          {dayLabel}
        </Typography>
        <Chip size="small" label={`${count}`} sx={chipNeutralSx} />
      </Box>
      <Box sx={{ justifySelf: "center", display: "flex", alignItems: "baseline", gap: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 900, fontSize: 18 }}>
          <Box component="span" sx={{ color: "#18c964" }}>
            {wl.w} W
          </Box>
          <Box component="span" sx={{ color: "var(--textSecondary)", mx: 1 }}>
            {" "}
            //{" "}
          </Box>
          <Box component="span" sx={{ color: "#ff6b6b" }}>
            {wl.l} L
          </Box>
        </Typography>
      </Box>
      <Box sx={{ justifySelf: "end", display: "grid", gridAutoFlow: "column", gap: 2 }}>
        <HeaderStat label="Avg DPM" value={avg.dpm.toFixed(1)} />
        <HeaderStat label="Avg KDA" value={avg.kda.toFixed(2)} />
        <HeaderStat label="Avg GPM" value={avg.gpm.toFixed(1)} />
      </Box>
    </Box>
  )
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "grid", gap: 0, justifyItems: "center" }}>
      <Typography variant="caption" sx={{ color: "var(--textSecondary)", fontSize: 12 }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 900, fontSize: 18, color: "#fff" }}>
        {value}
      </Typography>
    </Box>
  )
}

function MatchRow({ m, champAvg }: { m: Match; champAvg: ChampAverages }) {
  const isWin = m.result === "W"
  const tint = isWin ? "#18c964" : "#ff6b6b"
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.25,
        borderRadius: 2,
        border: `1px solid ${dividerColor}`,
        backgroundColor: `color-mix(in oklab, ${tint}, var(--card) 93%)`,
        position: "relative",
        overflow: "hidden",
        "::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: tint,
          opacity: 0.85,
        },
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "auto 1fr auto auto auto auto",
            sm: "auto 1fr auto auto auto auto",
            md: "auto 1fr auto auto auto auto",
          },
          alignItems: "center",
          columnGap: 2,
          rowGap: 0,
        }}
      >
        {/* Left meta */}
        <Box sx={{ display: "grid", gap: 0.375, alignContent: "start" }}>
          <Typography variant="body2" sx={{ color: "var(--textSecondary)", fontSize: 13 }}>
            {timeAgo(m.timestamp)}{m.durationSec ? ` // ${formatDuration(m.durationSec)}` : ""}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="body2" sx={{ color: tint, fontWeight: 900, fontSize: 18 }}>
              {m.queue}
            </Typography>
            <Box
              component="img"
              src={`/league/emblems/emblem_grandmaster.svg`}
              alt="rank"
              sx={{ width: 22, height: 22, opacity: 0.9 }}
            />
          </Box>
        </Box>

        {/* Center champ + spells/runes + items */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Box sx={{ position: "relative", width: 56, height: 56 }}>
            <Box
              component="img"
              src={`/league/champions/${championAssetName(m.champ.name)}.png`}
              alt={m.champ.name}
              title={prettyName(m.champ.name)}
              sx={{ width: 56, height: 56, objectFit: "cover", borderRadius: 1, border: `1px solid ${dividerColor}` }}
            />
          </Box>
          {/* Optional: Spells/Runes/Items, only if available */}
          {m.spells && m.runes ? (
            <Box sx={{ display: "grid", gridAutoFlow: "column", gridTemplateRows: "repeat(2, 1fr)", gap: 0.5, mr: 1.25 }}>
              {m.spells.map((id, i) => (
                <Box key={`spell-${i}`} component="img" src={spellIconPath(id)} alt={spellName(id)} title={spellName(id)} sx={{ width: 24, height: 24, borderRadius: 0.75, border: `1px solid ${dividerColor}`, objectFit: "cover", backgroundColor: "var(--background)" }} />
              ))}
              {m.runes.map((id, i) => (
                <Box key={`rune-${i}`} component="img" src={runeIconPath(id)} alt={runeName(id)} title={runeName(id)} sx={{ width: 24, height: 24, borderRadius: 0.75, border: `1px solid ${dividerColor}`, objectFit: "cover", backgroundColor: "var(--background)" }} />
              ))}
            </Box>
          ) : null}
          {m.champ.items ? <ItemsStrip items={m.champ.items} /> : null}
        </Box>

        {/* Right stats */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(6, auto)", md: "repeat(6, auto)" },
            alignItems: "center",
            columnGap: 2,
            rowGap: 0,
            justifyItems: "center",
            alignSelf: "center",
          }}
        >
          {/* Left: KDA with K/D/A underneath */}
          <Box sx={{ display: "grid", gap: 0.25, justifyItems: "center", textAlign: "center" }}>
            <Typography
              variant="body2"
              sx={{ color: "#4dd0e1", fontWeight: 900, fontSize: 18, lineHeight: 1 }}
            >{`${(kdaOf(m.k, m.d, m.a)).toFixed(2)} KDA`}</Typography>
            <Typography
              variant="caption"
              sx={{ color: "var(--textSecondary)", fontSize: 12, lineHeight: 1 }}
            >{`${m.k} // ${m.d} // ${m.a}`}</Typography>
          </Box>
          {/* Right: CS/min with above/below champ avg indicator */}
          <Tooltip placement="top" title="CS per minute: total minions + monsters divided by match minutes. Compared to the CHAMPION average (not player).">
            <Box>
              <StatWithIndicator
                label="CS/min"
                value={m.cs && m.durationSec ? csPerMin(m.cs, m.durationSec) : 0}
                avg={champAvg[m.champ.name]?.csPerMin ?? 0}
                decimals={1}
              />
            </Box>
          </Tooltip>
          {/* Middle: GPM and DPM mini stats with indicator */}
          <Tooltip placement="top" title="Gold per minute: average gold earned per minute. Compared to the CHAMPION average (not player).">
            <Box>
              <StatWithIndicator label="GPM" value={m.gpm ?? 0} avg={champAvg[m.champ.name]?.gpm ?? 0} decimals={1} />
            </Box>
          </Tooltip>
          <Tooltip placement="top" title="Damage per minute: average damage dealt per minute. Compared to the CHAMPION average (not player).">
            <Box>
              <StatWithIndicator label="DPM" value={m.dpm ?? 0} avg={champAvg[m.champ.name]?.dpm ?? 0} decimals={1} />
            </Box>
          </Tooltip>
          {/* Objective damage */}
          <Tooltip placement="top" title="Objective damage: total damage to towers, dragons, herald, baron, and other objectives. Compared to the CHAMPION average (not player).">
            <Box>
              <StatWithIndicator label="Obj Dmg" value={m.objDmg ?? 0} avg={champAvg[m.champ.name]?.objDmg ?? 0} decimals={0} />
            </Box>
          </Tooltip>
          {/* Vision score with indicator */}
          <Tooltip placement="top" title="Vision score: wards placed/cleared and vision contributions. Compared to the CHAMPION average (not player).">
            <Box>
              <StatWithIndicator label="Vision" value={m.vision ?? 0} avg={champAvg[m.champ.name]?.vision ?? 0} decimals={0} />
            </Box>
          </Tooltip>
        </Box>

        {/* Prediction badge (minimal, subtle) */}
        <Box sx={{ display: "grid", placeItems: "center" }}>
          <Tooltip placement="top" title="Predicted outcome based on pre-match factors. This is a demo estimate for mock data.">
            <Box>
              <PredictionBadge
                isWinPredicted={mockPredictionByMatch[m.id] ?? true}
                size={24}
                interactive
                defaultExpanded={false}
              />
            </Box>
          </Tooltip>
        </Box>

        {/* Performance score (replaced spiral with clean circular progress) */}
        <Box sx={{ display: "grid", placeItems: "center" }}>
          <Tooltip placement="top" title="Performance Score: 0–10000 prototype. post match scores. This is a demo estimate for mock data.">
            <Box>
              <PerformanceScore score={mockScoreByMatch[m.id] ?? 5000} size={75} />
            </Box>
          </Tooltip>
        </Box>

        {/* Teams column - render when we have rosters */}
        {m.allies && m.enemies ? (
          <Box sx={{ display: "grid", gap: 1, justifyItems: "end" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "6px auto", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 6, height: 24, borderRadius: 1, backgroundColor: "#4da3ff" }} />
              <TeamIcons champs={m.allies} align="left" size={24} />
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "6px auto", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 6, height: 24, borderRadius: 1, backgroundColor: "#ff6b6b" }} />
              <TeamIcons champs={m.enemies} align={"right"} size={24} />
            </Box>
          </Box>
        ) : null}
      </Box>
      <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, backgroundColor: tint, opacity: 0.85 }} />
    </Paper>
  )
}

function ItemsStrip({ items }: { items: (number | null)[] }) {
  // Expecting 7 entries: 6 core items + 1 trinket at index 6
  const core = items.slice(0, 6)
  const trinket = items[6] ?? 0
  const slot = (it: number | null, key: React.Key, size = 24, ring = false) => (
    <Box
      key={key}
      title={ring ? "Trinket" : it ? `Item ${it}` : "Empty"}
      sx={{
        width: size,
        height: size,
        borderRadius: 0.75,
        border: `1px solid ${ring ? "#d4af37" : dividerColor}`,
        backgroundColor: it ? "transparent" : "color-mix(in oklab, var(--border), transparent 85%)",
        overflow: "hidden",
      }}
    >
      {it ? (
        <Box
          component="img"
          src={`/league/items/${it}.png`}
          alt={`item ${it}`}
          title={`Item ${it}`}
          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}
    </Box>
  )
  return (
    <Box sx={{ display: "grid", gridAutoFlow: "column", alignItems: "center", gap: 1 }}>
      <Box
        sx={{ display: "grid", gridTemplateColumns: "repeat(3, 24px)", gridTemplateRows: "repeat(2, 24px)", gap: 0.5 }}
      >
        {core.map((it, i) => slot(it, i))}
      </Box>
      {slot(trinket as number, "trinket", 24, true)}
    </Box>
  )
}

// Small helper for stat indicators vs champion average
function StatWithIndicator({
  label,
  value,
  avg,
  decimals = 1,
}: {
  label: string
  value: number
  avg: number
  decimals?: number
}) {
  const delta = value - avg
  const pct = avg > 0 ? (delta / avg) * 100 : 0
  const close = Math.abs(pct) < 3 // within ±3% treated as neutral
  const up = pct > 0 && !close
  const down = pct < 0 && !close
  const tint = up ? "#18c964" : down ? "#ff6b6b" : "var(--textSecondary)"
  const symbol = up ? "↑" : down ? "↓" : "•"
  const percentStr = `${Math.abs(pct).toFixed(0)}%`
  const directionStr = up ? "above" : down ? "below" : "about"
  const title = `${value.toFixed(decimals)} ${label.toLowerCase()} — ${directionStr} champion average${
    up || down ? ` by ${percentStr}` : ""
  } (avg ${avg.toFixed(decimals)})`

  return (
    <Box sx={{ display: "grid", justifyItems: "center", textAlign: "center", gap: 0.25 }} title={title}>
      <Typography variant="caption" sx={{ color: "var(--textSecondary)", fontSize: 12, lineHeight: 1 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography variant="body2" sx={{ color: "#fff", fontWeight: 900, fontSize: 16, lineHeight: 1 }}>
          {value.toFixed(decimals)}
        </Typography>
        <Typography
          component="span"
          sx={{ color: tint, fontWeight: 900, fontSize: 12, lineHeight: 1, opacity: up || down ? 1 : 0.7 }}
          aria-label={up ? "above average" : down ? "below average" : "around average"}
        >
          {symbol}
        </Typography>
      </Box>
    </Box>
  )
}

function TeamIcons({ champs, align, size = 18 }: { champs: string[]; align: "left" | "right"; size?: number }) {
  return (
    <Box sx={{ display: "flex", gap: 0.375, justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
      {champs.map((c, i) => (
        <Box
          key={i}
          component="img"
          src={`/league/champions/${championAssetName(c)}.png`}
          alt={c}
          title={prettyName(c)}
          sx={{
            width: size,
            height: size,
            borderRadius: 0.75,
            border: `1px solid ${dividerColor}`,
            objectFit: "cover",
          }}
        />
      ))}
    </Box>
  )
}

// helpers
function groupByDay(matches: Match[]) {
  type Group = { key: number; label: string; items: Match[] }
  const byKey: Record<number, Group> = {}
  for (const m of matches) {
    const d = new Date(m.timestamp)
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    if (!byKey[dayStart]) byKey[dayStart] = { key: dayStart, label, items: [] }
    byKey[dayStart].items.push(m)
  }
  // Sort groups by actual day timestamp descending
  return Object.values(byKey).sort((a, b) => b.key - a.key)
}

function average(nums: number[]) {
  if (!nums.length) return 0
  return nums.reduce((s, n) => s + n, 0) / nums.length
}

function kdaOf(k: number, d: number, a: number) {
  return (k + a) / Math.max(1, d)
}

function csPerMin(cs: number, durationSec: number) {
  return cs / Math.max(1, durationSec / 60)
}

function timeAgo(ts: number) {
  const now = Date.now()
  const diff = Math.max(0, now - ts)
  const days = Math.floor(diff / (24 * 3600 * 1000))
  if (days > 0) return `${days}d ago`
  const hours = Math.floor(diff / (3600 * 1000))
  if (hours > 0) return `${hours}h ago`
  const mins = Math.floor(diff / (60 * 1000))
  return `${mins}m ago`
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s.toString().padStart(2, "0")}s`
}

// Pretty-print champion ids like "miss_fortune" -> "Miss Fortune"
function prettyName(id: string) {
  // Normalize snake_case and spaces to spaces
  const normalized = id.replace(/[_]+/g, " ")
  // Split words by spaces and camelCase boundaries
  const parts = normalized.split(" ").flatMap((segment) => segment.split(/(?=[A-Z])/))
  return parts
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

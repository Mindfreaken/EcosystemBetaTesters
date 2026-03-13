"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Paper from "@mui/material/Paper";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { Globe } from "lucide-react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import { themeVar } from "@/theme/registry";

export type LeaderboardRow = {
  rank: number;
  player: string;
  lp: number; // formerly rating
  wins: number;
  losses: number;
  region: string;
  iconId?: number; // maps to /league/profile-icons/{id}.png
  puuid?: string; // optional player id for deep linking
  tier?:
    | "iron"
    | "bronze"
    | "silver"
    | "gold"
    | "platinum"
    | "emerald"
    | "diamond"
    | "master"
    | "grandmaster"
    | "challenger"; // maps to /league/emblems/emblem_{tier}.svg
};

function generateMockRows(count: number, game: string): LeaderboardRow[] {
  const regions = ["NA", "EUW", "EUNE", "KR", "BR", "LATAM", "APAC"];
  const rows: LeaderboardRow[] = [];
  for (let i = 1; i <= count; i++) {
    const region = regions[i % regions.length];
    // derive a mock icon id (stick to available range by cycling)
    const iconId = 1000 + (i % 500);
    // derive LP and map to a tier
    const lp = 3000 + Math.floor((count - i) * 2.3) + (i % 25);
    const tier: LeaderboardRow["tier"] =
      lp > 4200
        ? "challenger"
        : lp > 4100
        ? "grandmaster"
        : lp > 4000
        ? "master"
        : lp > 3850
        ? "diamond"
        : lp > 3700
        ? "emerald"
        : lp > 3550
        ? "platinum"
        : lp > 3400
        ? "gold"
        : lp > 3250
        ? "silver"
        : lp > 3100
        ? "bronze"
        : "iron";
    rows.push({
      rank: i,
      player: `${game}-Player${String(i).padStart(4, "0")}`,
      lp,
      wins: 50 + (i % 300),
      losses: 20 + (i % 200),
      region,
      iconId,
      tier,
    });
  }
  return rows;
}

export default function Leaderboard({
  game = "Game",
  rows,
  pageSize = 100,
  onRowClick,
  useMock = false,
  loadingText,
  emptyText,
}: {
  title?: string;
  game?: string;
  rows?: LeaderboardRow[] | null; // null => loading, undefined => not provided
  pageSize?: number; // default 100 per page
  onRowClick?: (row: LeaderboardRow) => void;
  useMock?: boolean;
  loadingText?: string;
  emptyText?: string;
}) {
  const data = React.useMemo(() => {
    if (useMock) return generateMockRows(350, game);
    return rows ?? [];
  }, [rows, useMock, game]);
  const [regionFilter, setRegionFilter] = React.useState<string>("all");
  const filtered = React.useMemo(
    () => (regionFilter === "all" ? data : data.filter((r) => r.region === regionFilter)),
    [data, regionFilter]
  );
  const [page, setPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, filtered.length);
  const pageRows = filtered.slice(start, end);

  // Mock user info modal state (no Convex calls)
  const [selectedRow, setSelectedRow] = React.useState<LeaderboardRow | null>(null);

  React.useEffect(() => {
    // Clamp page if data length changed
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const regions = React.useMemo(() => {
    const set = new Set<string>();
    for (const r of data) set.add(r.region);
    return ["all", ...Array.from(set)];
  }, [data]);

  // Loading / Empty states when not using mock data
  if (!useMock && rows == null) {
    return (
      <Box sx={{ maxWidth: 1100, mx: "auto", width: "100%", p: 2 }}>
        <Typography variant="body2" sx={{ color: themeVar("mutedForeground") }}>
          {loadingText ?? "Loading leaderboard..."}
        </Typography>
      </Box>
    );
  }

  if (!useMock && data.length === 0) {
    return (
      <Box sx={{ maxWidth: 1100, mx: "auto", width: "100%", p: 2 }}>
        <Typography variant="body2" sx={{ color: themeVar("mutedForeground") }}>
          {emptyText ?? "No leaderboard data."}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="caption" sx={{ color: themeVar("mutedForeground") }}>
            Showing {start + 1}–{end} of {filtered.length}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FormControl
            size="small"
            variant="outlined"
            sx={{
              minWidth: 160,
              borderRadius: 1.5,
              // Subtle glassy card with depth
              background: `color-mix(in oklab, ${themeVar("card")}, transparent 15%)`,
              border: `1px solid color-mix(in oklab, ${themeVar("border")}, transparent 35%)`,
              boxShadow:
                `0 2px 8px color-mix(in oklab, ${themeVar("foreground")}, transparent 92%), 0 0 24px color-mix(in oklab, ${themeVar("primary")}, transparent 92%)`,
              backdropFilter: "blur(6px)",
              position: 'relative',
              '&::before': {
                content: "''",
                position: 'absolute',
                inset: 0,
                borderRadius: 'inherit',
                pointerEvents: 'none',
                background: `linear-gradient(90deg, ${themeVar("primary")}, ${themeVar("secondary")})`,
                opacity: 0.12,
                zIndex: 0,
              },
              '&:hover': {
                boxShadow:
                  `0 4px 14px color-mix(in oklab, ${themeVar("foreground")}, transparent 90%), 0 0 28px color-mix(in oklab, ${themeVar("primary")}, transparent 88%)`,
                borderColor: `color-mix(in oklab, ${themeVar("primary")}, transparent 65%)`,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
            }}
          >
            <Select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              displayEmpty
              inputProps={{ "aria-label": "Region filter" }}
              sx={{
                height: 34,
                px: 1.25,
                color: themeVar("foreground"),
                '& .MuiSelect-icon': {
                  color: `color-mix(in oklab, ${themeVar("mutedForeground")}, transparent 10%)`,
                },
                '&.Mui-focused': {
                  boxShadow: `0 0 0 2px color-mix(in oklab, ${themeVar("primary")}, transparent 65%) inset`,
                  borderRadius: 1.5,
                },
              }}
              renderValue={(value) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ display: 'grid', placeItems: 'center', color: `color-mix(in oklab, ${themeVar("mutedForeground")}, transparent 10%)` }}>
                    <Globe size={14} />
                  </Box>
                  <Typography variant="caption" sx={{ color: themeVar("foreground"), fontWeight: 600 }}>
                    {value === 'all' ? 'All regions' : String(value)}
                  </Typography>
                </Box>
              )}
              MenuProps={{
                PaperProps: {
                  elevation: 0,
                  sx: {
                    mt: 0.5,
                    borderRadius: 1.25,
                    border: `1px solid color-mix(in oklab, ${themeVar("border")}, transparent 30%)`,
                    background: themeVar("card"),
                    boxShadow:
                      `0 8px 24px color-mix(in oklab, ${themeVar("foreground")}, transparent 90%), 0 0 24px color-mix(in oklab, ${themeVar("secondary")}, transparent 90%)`,
                    overflow: 'hidden',
                    '& .MuiMenuItem-root': {
                      fontSize: 13,
                      color: themeVar("foreground"),
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'transform .18s ease, background-color .18s ease, box-shadow .18s ease',
                      '&::before': {
                        content: "''",
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 100%)',
                        transform: 'translateX(-100%)',
                        transition: 'transform .28s ease-out',
                        pointerEvents: 'none',
                      },
                      '&.Mui-selected': {
                        backgroundColor: `color-mix(in oklab, ${themeVar("primary")}, transparent 82%)`,
                        color: themeVar("foreground"),
                        boxShadow: `inset 3px 0 0 0 color-mix(in oklab, ${themeVar("primary")}, transparent 30%)`,
                      },
                      '&.Mui-selected:hover': {
                        backgroundColor: `color-mix(in oklab, ${themeVar("primary")}, transparent 78%)`,
                        color: themeVar("foreground"),
                      },
                      '&:hover': {
                        backgroundColor: `color-mix(in oklab, ${themeVar("foreground")}, transparent 82%)`,
                        color: themeVar("foreground"),
                        transform: 'translateX(2px)',
                        boxShadow: `inset 3px 0 0 0 color-mix(in oklab, ${themeVar("primary")}, transparent 35%), 0 2px 6px color-mix(in oklab, ${themeVar("foreground")}, transparent 90%)`,
                        '&::before': {
                          transform: 'translateX(0)'
                        }
                      },
                      '&:active': {
                        transform: 'translateX(1px) scale(0.995)',
                        backgroundColor: `color-mix(in oklab, ${themeVar("foreground")}, transparent 78%)`,
                        boxShadow: `inset 3px 0 0 0 color-mix(in oklab, ${themeVar("primary")}, transparent 45%)`,
                      },
                      '&.Mui-focusVisible': {
                        backgroundColor: `color-mix(in oklab, ${themeVar("secondary")}, transparent 82%)`,
                        boxShadow: `inset 3px 0 0 0 color-mix(in oklab, ${themeVar("secondary")}, transparent 35%)`,
                        color: themeVar("foreground"),
                      },
                    },
                  },
                },
              }}
            >
              {regions.map((r) => (
                <MenuItem key={r} value={r}>
                  {r === "all" ? "All regions" : r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          overflow: "hidden",
          borderRadius: 2,
          // Use a transparent border so our gradient ring can show through via masking
          border: "1px solid transparent",
          backgroundColor: "var(--card)",
          // Neon-like glow using theme colors
          boxShadow:
            "0 0 24px color-mix(in oklab, var(--primary), transparent 65%), 0 0 48px color-mix(in oklab, var(--secondary), transparent 75%)",
          position: "relative",
          // Blurred outer neon bloom
          "&::before": {
            content: "''",
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            borderRadius: "inherit",
            background: `linear-gradient(90deg, color-mix(in oklab, ${themeVar("primary")}, transparent 0%), color-mix(in oklab, ${themeVar("secondary")}, transparent 0%))`,
            filter: "blur(10px)",
            opacity: 0.7,
            zIndex: 0,
            // Mask so only the edge glows
            padding: "1px",
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          },
          // Crisp neon ring
          "&::after": {
            content: "''",
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            borderRadius: "inherit",
            background: `linear-gradient(90deg, ${themeVar("primary")}, ${themeVar("secondary")})`,
            zIndex: 1,
            padding: "1px",
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          },
        }}
      >
        <Table size="small" sx={{ minWidth: 700 }} aria-label={`${game} leaderboard`}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 90, fontWeight: 800, color: themeVar("mutedForeground") }}>Rank</TableCell>
              <TableCell sx={{ fontWeight: 800, color: themeVar("mutedForeground") }}>Player</TableCell>
              <TableCell sx={{ width: 120, fontWeight: 800, color: themeVar("mutedForeground") }} align="right">
                LP
              </TableCell>
              <TableCell sx={{ width: 140, fontWeight: 800, color: themeVar("mutedForeground") }} align="right">
                Win %
              </TableCell>
              <TableCell sx={{ width: 120, fontWeight: 800, color: themeVar("mutedForeground") }} align="right">
                Region
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow
                key={row.rank}
                hover
                onClick={onRowClick ? () => onRowClick(row) : () => setSelectedRow(row)}
                sx={{
                  cursor: onRowClick ? "pointer" : "default",
                  transition: "background-color .15s ease, box-shadow .15s ease",
                  '&:hover': onRowClick
                    ? {
                        backgroundColor: 'color-mix(in oklab, var(--foreground), transparent 94%)',
                      }
                    : undefined,
                  '&:active': onRowClick
                    ? {
                        backgroundColor: 'color-mix(in oklab, var(--foreground), transparent 90%)',
                      }
                    : undefined,
                }}
              >
                <TableCell component="th" scope="row" sx={{ fontWeight: 700, color: themeVar("foreground") }}>
                  {row.rank}
                </TableCell>
                <TableCell sx={{ color: "var(--foreground)" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Box
                      component="img"
                      src={`/league/profile-icons/${row.iconId ?? 1000}.png`}
                      alt="profile icon"
                      width={26}
                      height={26}
                      style={{ borderRadius: 6, objectFit: "cover" }}
                    />
                    <Typography component="span" sx={{ fontWeight: 700 }}>{row.player}</Typography>
                    {row.tier && (
                      <Box
                        component="img"
                        src={`/league/emblems/emblem_${row.tier}.svg`}
                        alt={`${row.tier} emblem`}
                        width={18}
                        height={18}
                        sx={{ ml: 0.5, opacity: 0.9 }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ color: themeVar("foreground") }}>{row.lp}</TableCell>
                <TableCell align="right" sx={{ color: themeVar("foreground") }}>
                  {(((row.wins / Math.max(1, row.wins + row.losses)) * 100)).toFixed(1)}%
                </TableCell>
                <TableCell align="right" sx={{ color: themeVar("foreground") }}>{row.region}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, p) => setPage(p)}
          siblingCount={1}
          boundaryCount={1}
          color="primary"
          shape="rounded"
          size="small"
        />
      </Stack>

      {/* Mock Player Info Modal */}
      <Dialog
        open={Boolean(selectedRow)}
        onClose={() => setSelectedRow(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            background: themeVar("card"),
            border: `1px solid color-mix(in oklab, ${themeVar("border")}, transparent 30%)`,
            boxShadow: `0 12px 32px color-mix(in oklab, ${themeVar("foreground")}, transparent 85%)`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: themeVar("foreground") }}>
          {selectedRow?.player}
        </DialogTitle>
        <DialogContent>
          {selectedRow && (
            <Box sx={{ display: 'grid', gap: 1.25 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Box
                  component="img"
                  src={`/league/profile-icons/${selectedRow.iconId ?? 1000}.png`}
                  alt="profile icon"
                  width={42}
                  height={42}
                  sx={{ borderRadius: 1.25, objectFit: 'cover' }}
                />
                {selectedRow.tier && (
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <Box component="img" src={`/league/emblems/emblem_${selectedRow.tier}.svg`} width={20} height={20} alt="tier" />
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedRow.tier.toUpperCase()}</Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 1 }}>
                <Stat label="Region" value={selectedRow.region} />
                <Stat label="Rank" value={`#${selectedRow.rank}`} />
                <Stat label="LP" value={String(selectedRow.lp)} />
                <Stat label="Win %" value={`${((selectedRow.wins / Math.max(1, selectedRow.wins + selectedRow.losses)) * 100).toFixed(1)}%`} />
              </Box>

              <Typography variant="caption" sx={{ color: 'var(--muted-foreground)' }}>
                This is mock profile data for preview purposes.
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        p: 1,
        borderRadius: 1,
        border: '1px solid color-mix(in oklab, var(--border), transparent 35%)',
        background: 'color-mix(in oklab, var(--card), transparent 6%)',
      }}
    >
      <Typography variant="caption" sx={{ color: 'var(--muted-foreground)' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1 }}>{value}</Typography>
    </Box>
  );
}



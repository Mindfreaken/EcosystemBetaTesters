import React, { useMemo, useState } from "react";
import { Box, Button, Dialog, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { themeVar } from "@/theme/registry";

const PERIODS = [
  { key: "test", start: "2025-10-17", end: "2025-10-31", filterable: false },
  { key: "beta", start: "2025-11-01", end: "2026-12-31", filterable: true },
  { key: "season1", start: "2027-01-01", end: "2027-03-31", filterable: true },
  { key: "season2", start: "2027-04-01", end: "2027-06-30", filterable: true },
  { key: "season3", start: "2027-07-01", end: "2027-09-30", filterable: true },
  { key: "season4", start: "2027-10-01", end: "2027-12-31", filterable: true },
  { key: "season5", start: "2028-01-01", end: "2028-03-31", filterable: true },
  { key: "season6", start: "2028-04-01", end: "2028-06-30", filterable: true },
];

function findActivePeriod(): { key: string; start: string; end: string; filterable: boolean } {
  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(today.getUTCDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;
  for (const p of PERIODS) {
    if (todayStr >= p.start && todayStr <= p.end) return p;
  }
  return PERIODS[0];
}

export default function LeaderboardModal({ open, onClose, game = "valorant" }: { open: boolean; onClose: () => void; game?: string }) {
  const active = useMemo(() => findActivePeriod(), []);
  const [seasonKey, setSeasonKey] = useState<string>(active.key);
  const [gameKey, setGameKey] = useState<string>(game);
  const season = PERIODS.find(p => p.key === seasonKey) ?? active;
  const allowFilter = active.filterable;

  const rows = useQuery(api.dailies.nerdle.leaderboard.seasonStats, { game: gameKey, start: season.start, end: season.end }) ?? [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(180deg, ${themeVar("card")}, ${themeVar("background")})`,
          border: `1px solid ${themeVar("border")}`,
          color: themeVar("textLight"),
          borderRadius: 4,
          backgroundImage: "none",
        }
      }}
    >
      <DialogTitle sx={{ color: themeVar("textLight"), fontWeight: 900, fontSize: "1.5rem", mb: 0 }}>Leaderboard</DialogTitle>
      <DialogContent sx={{ color: themeVar("textSecondary") }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(200px, 1fr))',
            gap: 2,
            alignItems: 'center',
            mb: 2,
          }}
        >
          <FormControl size="small" variant="outlined" sx={{ minWidth: 200 }}>
            <Typography variant="caption" sx={{ color: themeVar("textSecondary"), fontWeight: 700, mb: 1, display: 'block', letterSpacing: 1 }}>GAME</Typography>
            <Select
              value={gameKey}
              onChange={(e) => setGameKey(e.target.value as string)}
              sx={{
                color: themeVar("textLight"),
                borderRadius: 1.5,
                background: `color-mix(in oklab, ${themeVar("card")}, transparent 40%)`,
                '.MuiOutlinedInput-notchedOutline': { borderColor: themeVar("border") },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: themeVar("highlight") },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: themeVar("highlight") },
                '.MuiSelect-select': { fontWeight: 600 },
                '.MuiSvgIcon-root': { color: themeVar("textSecondary") },
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                '&.Mui-disabled': { opacity: 0.5, color: themeVar("textSecondary") },
              }}
              MenuProps={{
                PaperProps: { sx: { background: themeVar("card"), color: themeVar("textLight"), border: `1px solid ${themeVar("border")}`, backgroundImage: "none" } }
              }}
            >
              <MenuItem value="valorant">Valorant</MenuItem>
              <MenuItem value="minecraft">Minecraft</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" variant="outlined" sx={{ minWidth: 220 }}>
            <Typography variant="caption" sx={{ color: themeVar("textSecondary"), fontWeight: 700, mb: 1, display: 'block', letterSpacing: 1 }}>SEASON</Typography>
            <Select
              value={seasonKey}
              onChange={(e) => setSeasonKey(e.target.value as string)}
              disabled={!allowFilter}
              sx={{
                color: themeVar("textLight"),
                borderRadius: 1.5,
                background: `color-mix(in oklab, ${themeVar("card")}, transparent 40%)`,
                '.MuiOutlinedInput-notchedOutline': { borderColor: themeVar("border") },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: themeVar("highlight") },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: themeVar("highlight") },
                '.MuiSelect-select': { fontWeight: 600 },
                '.MuiSvgIcon-root': { color: themeVar("textSecondary") },
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                '&.Mui-disabled': { opacity: 0.5, color: themeVar("textSecondary") },
              }}
              MenuProps={{
                PaperProps: { sx: { background: themeVar("card"), color: themeVar("textLight"), border: `1px solid ${themeVar("border")}`, backgroundImage: "none" } }
              }}
            >
              {PERIODS.filter(p => p.filterable).map((p) => (
                <MenuItem key={p.key} value={p.key} sx={{ color: themeVar("textLight") }}>{p.key.toUpperCase()}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Table size="small" sx={{
          '& th, & td': { color: themeVar("textSecondary"), borderColor: themeVar("border"), py: 1.5 }
        }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: `${themeVar("textLight")} !important` }}>#</TableCell>
              <TableCell sx={{ fontWeight: 800, color: `${themeVar("textLight")} !important` }}>AGENT</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: `${themeVar("textLight")} !important` }}>WINS</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: `${themeVar("textLight")} !important` }}>LOSSES</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: `${themeVar("textLight")} !important` }}>DNF</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: `${themeVar("textLight")} !important` }}>W/L</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: `${themeVar("textLight")} !important` }}>STREAK</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: `${themeVar("textLight")} !important` }}>AVG GUESS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r: any, idx: number) => (
              <TableRow key={r.userId + idx} sx={{ '&:hover': { background: `color-mix(in oklab, ${themeVar("highlight")}, transparent 96%)` } }}>
                <TableCell sx={{ fontWeight: 700 }}>{idx + 1}</TableCell>
                <TableCell sx={{ fontWeight: 700, color: themeVar("textLight") }}>{r.displayName}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: themeVar("success") }}>{r.wins}</TableCell>
                <TableCell align="right">{r.losses - r.dnfs}</TableCell>
                <TableCell align="right">{r.dnfs}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{(r.wlRatio).toFixed(2)}</TableCell>
                <TableCell align="right">{r.currentStreak}</TableCell>
                <TableCell align="right">{r.avgGuesses ? r.avgGuesses.toFixed(2) : "-"}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography variant="body2" sx={{ color: themeVar("textSecondary"), textAlign: "center", py: 4, fontStyle: "italic" }}>No data yet.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
          <Button
            variant="contained"
            onClick={onClose}
            sx={{
              bgcolor: themeVar("highlight"),
              color: "#000",
              fontWeight: 800,
              px: 4,
              borderRadius: 2,
              "&:hover": { bgcolor: `color-mix(in oklab, ${themeVar("highlight")}, #fff 10%)` }
            }}
          >
            CLOSE
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

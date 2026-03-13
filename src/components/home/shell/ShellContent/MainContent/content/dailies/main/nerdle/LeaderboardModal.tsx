import React, { useMemo, useState } from "react";
import { 
    Box, Button, Dialog, DialogContent, DialogTitle, FormControl, 
    IconButton, MenuItem, Select, Table, TableBody, TableCell, 
    TableHead, TableRow, Typography 
} from "@mui/material";
import { X, Trophy, Gamepad2, History } from "lucide-react";
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
            slotProps={{
                backdrop: {
                    sx: {
            sx: {
              backgroundColor: `color-mix(in oklab, ${themeVar("background")}, transparent 20%)`,
              backdropFilter: 'blur(4px)',
            }
                    }
                }
            }}
            PaperProps={{
                sx: {
                    bgcolor: `color-mix(in oklab, ${themeVar("background")}, transparent 20%)`,
                    backdropFilter: "blur(12px)",
                    borderRadius: "9px",
                    border: `1px solid ${themeVar("border")}`,
                    backgroundImage: "none",
                    boxShadow: `0 8px 32px color-mix(in oklab, ${themeVar("foreground")}, transparent 80%)`,
                    overflow: "hidden"
                }
            }}
        >
            <DialogTitle sx={{ 
                fontWeight: 900, 
                color: themeVar("foreground"),
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                pb: 1,
                borderBottom: `1px solid ${themeVar("border")}`
            }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Trophy size={20} style={{ color: themeVar("chart3") }} />
                    Hall of Fame
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: themeVar("mutedForeground") }}>
                    <X size={20} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ p: 3 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 2,
                            alignItems: 'center',
                            mb: 4,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: `color-mix(in oklab, ${themeVar("background")}, transparent 15%)`,
                            border: `1px solid ${themeVar("border")}`
                        }}
                    >
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                <Gamepad2 size={12} style={{ color: themeVar("mutedForeground") }} />
                                <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>Game Type</Typography>
                            </Box>
                            <Select
                                value={gameKey}
                                onChange={(e) => setGameKey(e.target.value as string)}
                                sx={{
                                    color: themeVar("foreground"),
                                    borderRadius: 1.5,
                                    bgcolor: "rgba(0,0,0,0.3)",
                                    '.MuiOutlinedInput-notchedOutline': { borderColor: "rgba(255,255,255,0.1)" },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: themeVar("primary") },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: themeVar("primary") },
                                    '.MuiSelect-select': { fontWeight: 700, fontSize: "0.85rem" },
                                    '.MuiSvgIcon-root': { color: themeVar("mutedForeground") },
                                }}
                                MenuProps={{
                                    PaperProps: { sx: { bgcolor: themeVar("muted"), border: `1px solid ${themeVar("border")}`, borderRadius: 2, backgroundImage: "none" } }
                                }}
                            >
                                <MenuItem value="valorant" sx={{ fontWeight: 600 }}>Valorant</MenuItem>
                                <MenuItem value="minecraft" sx={{ fontWeight: 600 }}>Minecraft</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                <History size={12} style={{ color: themeVar("mutedForeground") }} />
                                <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>Season</Typography>
                            </Box>
                            <Select
                                value={seasonKey}
                                onChange={(e) => setSeasonKey(e.target.value as string)}
                                disabled={!allowFilter}
                                sx={{
                                    color: themeVar("foreground"),
                                    borderRadius: 1.5,
                                    bgcolor: "rgba(0,0,0,0.3)",
                                    '.MuiOutlinedInput-notchedOutline': { borderColor: "rgba(255,255,255,0.1)" },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: themeVar("primary") },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: themeVar("primary") },
                                    '.MuiSelect-select': { fontWeight: 700, fontSize: "0.85rem" },
                                    '.MuiSvgIcon-root': { color: themeVar("mutedForeground") },
                                }}
                                MenuProps={{
                                    PaperProps: { sx: { bgcolor: themeVar("muted"), border: `1px solid ${themeVar("border")}`, borderRadius: 2, backgroundImage: "none" } }
                                }}
                            >
                                {PERIODS.filter(p => p.filterable).map((p) => (
                                    <MenuItem key={p.key} value={p.key} sx={{ color: themeVar("foreground"), fontWeight: 600 }}>{p.key.toUpperCase()}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <Box sx={{ minHeight: 400 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ '& th': { borderBottom: `2px solid ${themeVar("border")}`, pb: 2, color: themeVar("mutedForeground"), fontWeight: 900, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1 } }}>
                                    <TableCell>Rank</TableCell>
                                    <TableCell>Agent</TableCell>
                                    <TableCell align="right">Wins</TableCell>
                                    <TableCell align="right">DNF</TableCell>
                                    <TableCell align="right">W/L</TableCell>
                                    <TableCell align="right">Streak</TableCell>
                                    <TableCell align="right">Avg Guess</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map((r: any, idx: number) => {
                                    const isTopThree = idx < 3;
                                    const rankColor = idx === 0 ? "#ffd700" : idx === 1 ? "#c0c0c0" : idx === 2 ? "#cd7f32" : themeVar("foreground");
                                    
                                    return (
                                        <TableRow 
                                            key={r.userId + idx} 
                                            sx={{ 
                                                '&:hover': { background: `color-mix(in oklab, ${themeVar("foreground")}, transparent 97%)` },
                                                '& td': { borderBottom: `1px solid color-mix(in oklab, ${themeVar("border")}, transparent 70%)`, py: 2 }
                                            }}
                                        >
                                            <TableCell>
                                                <Box sx={{ 
                                                    width: 28, height: 28, borderRadius: "50%", 
                                                    display: "grid", placeItems: "center", 
                                                    bgcolor: isTopThree ? `color-mix(in oklab, ${rankColor}, transparent 80%)` : "transparent",
                                                    color: rankColor,
                                                    fontWeight: 900,
                                                    fontSize: isTopThree ? "0.9rem" : "0.85rem",
                                                    border: isTopThree ? `1px solid ${rankColor}` : "none"
                                                }}>
                                                    {idx + 1}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 800, color: themeVar("foreground"), fontSize: "0.9rem" }}>{r.displayName}</Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 900, color: themeVar("primary"), fontSize: "0.9rem" }}>{r.wins}</TableCell>
                                            <TableCell align="right" sx={{ color: themeVar("mutedForeground"), fontSize: "0.85rem" }}>{r.dnfs}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 800, color: themeVar("foreground"), fontSize: "0.85rem" }}>{(r.wlRatio).toFixed(2)}</TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: "inline-flex", px: 1, py: 0.25, borderRadius: 1, bgcolor: `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)`, color: themeVar("primary"), fontWeight: 800, fontSize: "0.75rem" }}>
                                                    {r.currentStreak} 🔥
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, color: themeVar("chart3"), fontSize: "0.85rem" }}>
                                                {r.avgGuesses ? r.avgGuesses.toFixed(2) : "-"}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {rows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7}>
                                            <Box sx={{ py: 8, textAlign: "center", opacity: 0.5 }}>
                                                <Trophy size={48} style={{ marginBottom: 16, opacity: 0.2 }} />
                                                <Typography variant="body2" sx={{ fontStyle: "italic" }}>No champions recorded yet for this season.</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Box>
                </Box>
            </DialogContent>
            
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${themeVar("border")}`, bgcolor: `color-mix(in oklab, ${themeVar("background")}, transparent 90%)` }}>
                <Button
                    variant="contained"
                    onClick={onClose}
                    sx={{
                        bgcolor: themeVar("primary"),
                        color: "white",
                        fontWeight: 900,
                        px: 4,
                        py: 1,
                        borderRadius: "8px",
                        textTransform: "none",
                        boxShadow: `0 4px 14px color-mix(in oklab, ${themeVar("primary")}, transparent 60%)`,
                        "&:hover": { 
                            bgcolor: themeVar("primary"),
                            filter: "brightness(1.1)",
                            boxShadow: `0 6px 20px color-mix(in oklab, ${themeVar("primary")}, transparent 50%)`,
                        }
                    }}
                >
                    Dismiss
                </Button>
            </Box>
        </Dialog>
    );
}

"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { themeVar } from "@/theme/registry";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import { Clock, MessageSquare, Activity as ActivityIcon, Users, CalendarDays, BarChart3, Megaphone } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Doc, Id } from "convex/_generated/dataModel";

interface ActivityTabProps {
    space: Doc<"spaces">;
    role: "owner" | "admin" | "moderator";
}

interface StatTableProps {
    title: string;
    icon: React.ReactNode;
    rows: Array<{
        label: string;
        visits: number;
        msgs: number;
        voice: number;
    }>;
    emptyMessage?: string;
}

function StatTable({ title, icon, rows, emptyMessage = "No activity data recorded yet." }: StatTableProps) {
    return (
        <Box sx={{
            flex: 1,
            minWidth: 0,
            borderRadius: 3,
            bgcolor: `color-mix(in oklab, ${themeVar("muted")}, transparent 30%)`,
            border: `1px solid ${themeVar("border")}`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
        }}>
            {/* Table Header */}
            <Box sx={{
                px: 2,
                pt: 2,
                pb: 1.5,
                borderBottom: `1px solid ${themeVar("border")}`,
                flexShrink: 0,
                bgcolor: `color-mix(in oklab, ${themeVar("background")}, transparent 40%)`,
            }}>
                <Typography variant="caption" sx={{
                    fontWeight: 800,
                    color: themeVar("mutedForeground"),
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    letterSpacing: "0.08em",
                    fontSize: "0.68rem",
                }}>
                    {icon}
                    {title}
                </Typography>
            </Box>

            {/* Column Labels */}
            <Box sx={{
                display: "grid",
                gridTemplateColumns: "1fr repeat(3, 72px)",
                px: 2,
                py: 1,
                borderBottom: `1px solid color-mix(in oklab, ${themeVar("border")}, transparent 50%)`,
                flexShrink: 0,
            }}>
                <Box />
                {[
                    { label: "VISITS", color: themeVar("primary") },
                    { label: "MSGS", color: themeVar("primary") },
                    { label: "VOICE", color: themeVar("secondary") },
                ].map(({ label, color }) => (
                    <Typography
                        key={label}
                        variant="caption"
                        sx={{
                            textAlign: "center",
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            letterSpacing: "0.07em",
                            color,
                            opacity: 0.8,
                        }}
                    >
                        {label}
                    </Typography>
                ))}
            </Box>

            {/* Scrollable Rows */}
            <Box sx={{ flex: 1, overflowY: "auto", maxHeight: 300 }}>
                {rows.length === 0 ? (
                    <Typography variant="caption" sx={{
                        color: themeVar("mutedForeground"),
                        fontStyle: "italic",
                        display: "block",
                        textAlign: "center",
                        py: 3,
                    }}>
                        {emptyMessage}
                    </Typography>
                ) : (
                    <Stack>
                        {rows.map((row, i) => (
                            <Box
                                key={row.label}
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr repeat(3, 72px)",
                                    alignItems: "center",
                                    px: 2,
                                    py: 1.25,
                                    bgcolor: i % 2 === 0
                                        ? `color-mix(in oklab, ${themeVar("foreground")}, transparent 95%)`
                                        : "transparent",
                                    "&:hover": {
                                        bgcolor: `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)`,
                                    },
                                    transition: "background-color 0.15s ease",
                                }}
                            >
                                <Typography variant="body2" sx={{
                                    fontWeight: 600,
                                    color: themeVar("foreground"),
                                    fontSize: "0.8rem",
                                    letterSpacing: "0.01em",
                                }}>
                                    {row.label}
                                </Typography>
                                {[
                                    { value: row.visits, color: themeVar("primary") },
                                    { value: row.msgs, color: themeVar("primary") },
                                    { value: row.voice, color: themeVar("secondary") },
                                ].map(({ value, color }, ci) => (
                                    <Box key={ci} sx={{ display: "flex", justifyContent: "center" }}>
                                        <Box sx={{
                                            minWidth: 40,
                                            textAlign: "center",
                                            px: 1,
                                            py: 0.25,
                                            borderRadius: 1.5,
                                            bgcolor: `color-mix(in oklab, ${color}, transparent 82%)`,
                                        }}>
                                            <Typography variant="body2" sx={{
                                                fontWeight: 800,
                                                color,
                                                fontSize: "0.8rem",
                                                lineHeight: 1.3,
                                            }}>
                                                {value}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        ))}
                    </Stack>
                )}
            </Box>
        </Box>
    );
}

export default function ActivityTab({ space, role }: ActivityTabProps) {
    const detailedStats = useQuery(api.spaces.analytics.getDetailedStats, { spaceId: space._id });
    const globalActions = useQuery(api.spaces.audit.getAdminActions, { spaceId: space._id });

    const monthlyStats = React.useMemo(() => {
        if (!detailedStats) return [];
        const monthMap = new Map<string, { days: number, msgs: number, voice: number, visitors: number }>();
        detailedStats.forEach(stat => {
            const month = stat.day.substring(0, 7);
            if (!monthMap.has(month)) monthMap.set(month, { days: 0, msgs: 0, voice: 0, visitors: 0 });
            const data = monthMap.get(month)!;
            data.days++;
            data.msgs += stat.totalMessages;
            data.voice += stat.totalVoiceMinutes;
            data.visitors += (stat as any).uniqueVisitors || 0;
        });
        return Array.from(monthMap.entries()).map(([month, data]) => ({
            month,
            avgMsgs: Math.round(data.msgs / data.days),
            avgVoice: Math.round(data.voice / data.days),
            avgVisitors: Math.round(data.visitors / data.days)
        }));
    }, [detailedStats]);

    const totalMessages = detailedStats?.reduce((acc, curr) => acc + curr.totalMessages, 0) ?? 0;
    const totalVoice = Math.round(detailedStats?.reduce((acc, curr) => acc + curr.totalVoiceMinutes, 0) ?? 0);

    return (
        <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 3 }}>
            <Stack spacing={3} sx={{ flex: 1, minWidth: 0 }}>

                {/* Summary Cards */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    {[
                        {
                            icon: <MessageSquare size={12} />,
                            label: "MESSAGE VOLUME",
                            sublabel: "Total messages · last 30 days",
                            value: totalMessages,
                            color: themeVar("primary"),
                        },
                        {
                            icon: <Clock size={12} />,
                            label: "VOICE ENGAGEMENT",
                            sublabel: "Total minutes in voice channels",
                            value: totalVoice,
                            color: themeVar("secondary"),
                        },
                    ].map(({ icon, label, sublabel, value, color }) => (
                        <Box key={label} sx={{
                            borderRadius: 3,
                            bgcolor: `color-mix(in oklab, ${themeVar("muted")}, transparent 30%)`,
                            border: `1px solid ${themeVar("border")}`,
                            overflow: "hidden",
                        }}>
                            {/* Header strip — matches StatTable */}
                            <Box sx={{
                                px: 2,
                                pt: 1.75,
                                pb: 1.5,
                                borderBottom: `1px solid ${themeVar("border")}`,
                                bgcolor: `color-mix(in oklab, ${themeVar("background")}, transparent 40%)`,
                            }}>
                                <Typography variant="caption" sx={{
                                    fontWeight: 800,
                                    color: themeVar("mutedForeground"),
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.75,
                                    letterSpacing: "0.08em",
                                    fontSize: "0.68rem",
                                }}>
                                    {icon} {label}
                                </Typography>
                            </Box>
                            {/* Body */}
                            <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "baseline", gap: 1.5 }}>
                                <Box sx={{
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 2,
                                    bgcolor: `color-mix(in oklab, ${color}, transparent 82%)`,
                                    display: "inline-flex",
                                }}>
                                    <Typography variant="h4" sx={{ fontWeight: 900, color, lineHeight: 1 }}>
                                        {value.toLocaleString()}
                                    </Typography>
                                </Box>
                                <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontSize: "0.7rem" }}>
                                    {sublabel}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>

                {/* Activity Tables side by side */}
                <Box sx={{ display: "flex", flexDirection: { xs: "column", xl: "row" }, gap: 2.5, minHeight: 0 }}>
                    <StatTable
                        title="DAILY ACTIVITY LOG"
                        icon={<CalendarDays size={12} />}
                        rows={(detailedStats?.slice().reverse() ?? []).map(stat => ({
                            label: new Date(stat.day).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
                            visits: (stat as any).uniqueVisitors || 0,
                            msgs: stat.totalMessages,
                            voice: Math.round(stat.totalVoiceMinutes),
                        }))}
                    />
                    <StatTable
                        title="MONTHLY AVERAGES"
                        icon={<BarChart3 size={12} />}
                        rows={monthlyStats.map(stat => ({
                            label: new Date(stat.month + "-01T00:00:00").toLocaleDateString(undefined, { month: "short", year: "numeric" }),
                            visits: stat.avgVisitors,
                            msgs: stat.avgMsgs,
                            voice: stat.avgVoice,
                        }))}
                    />
                </Box>
            </Stack>

            {/* Right Column: Recent Logs */}
            <Box sx={{
                width: { xs: "100%", lg: 340 },
                flexShrink: 0,
                bgcolor: `color-mix(in oklab, ${themeVar("muted")}, transparent 50%)`,
                borderRadius: 3,
                border: `1px solid ${themeVar("border")}`,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}>
                <Box sx={{
                    px: 2,
                    pt: 2,
                    pb: 1.5,
                    borderBottom: `1px solid ${themeVar("border")}`,
                    flexShrink: 0,
                    bgcolor: `color-mix(in oklab, ${themeVar("background")}, transparent 40%)`,
                }}>
                    <Typography variant="caption" sx={{
                        fontWeight: 800,
                        color: themeVar("mutedForeground"),
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        letterSpacing: "0.08em",
                        fontSize: "0.68rem",
                    }}>
                        <ActivityIcon size={12} /> RECENT LOGS
                    </Typography>
                </Box>
                <Box sx={{ height: 370, overflowY: "auto", p: 1.5 }}>
                    <Stack spacing={1.5}>
                        {globalActions?.map((action: any) => {
                            let borderColor = themeVar("primary");
                            if (action.actionType.includes("poll")) borderColor = themeVar("secondary");
                            if (action.actionType.includes("event")) borderColor = themeVar("chart4");

                            return (
                                <Box key={action._id} sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: `color-mix(in oklab, ${themeVar("foreground")}, transparent 95%)`,
                                    borderLeft: `3px solid ${borderColor}`,
                                }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                        <Avatar src={action.admin?.avatarUrl} sx={{ width: 20, height: 20 }} />
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: themeVar("foreground"), flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {action.admin?.displayName}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), flexShrink: 0, fontSize: "0.65rem" }}>
                                            {new Date(action.timestamp).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: themeVar("mutedForeground"), fontSize: "0.78rem", lineHeight: 1.4, display: "flex", alignItems: "flex-start", gap: 1 }}>
                                        {action.actionType.includes("poll") && <BarChart3 size={14} style={{ marginTop: 2, flexShrink: 0, color: themeVar("secondary") }} />}
                                        {action.actionType.includes("event") && <CalendarDays size={14} style={{ marginTop: 2, flexShrink: 0, color: themeVar("chart4") }} />}
                                        {action.details}
                                    </Typography>
                                </Box>
                            );
                        })}
                        {(!globalActions || globalActions.length === 0) && (
                            <Typography variant="body2" sx={{ color: themeVar("mutedForeground"), textAlign: "center", py: 4 }}>
                                Audit logs are empty.
                            </Typography>
                        )}
                    </Stack>
                </Box>
            </Box>
        </Box>
    );
}



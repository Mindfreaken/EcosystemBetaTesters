"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Stack from "@mui/material/Stack";
import { List, Calendar as CalendarIcon, Clock, Link as LinkIcon, Hash } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Doc, Id } from "convex/_generated/dataModel";
import { themeVar } from "@/theme/registry";

interface ScheduleChannelProps {
    channel: Doc<"spaceChannels">;
    spaceId: string;
}

export default function ScheduleChannel({ channel, spaceId }: ScheduleChannelProps) {
    const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
    const eventsQuery = useQuery(api.spaces.schedule.getEvents, { spaceId: spaceId as Id<"spaces"> });
    const markAsRead = useMutation(api.spaces.channels.markChannelAsRead);

    React.useEffect(() => {
        if (eventsQuery !== undefined) {
            markAsRead({ channelId: channel._id });
        }
    }, [eventsQuery !== undefined, channel._id, markAsRead]);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: themeVar("background"), p: 3, overflowY: "auto" }}>
            <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                    <Box sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        bgcolor: `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 1.5
                    }}>
                        <Hash size={24} style={{ color: themeVar("primary") }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: themeVar("foreground") }}>
                        #{channel.name} Schedule
                    </Typography>
                    <Typography variant="body2" sx={{ color: themeVar("mutedForeground"), display: "block", mt: 0.5 }}>
                        {channel.description || "Upcoming events and scheduled activities."}
                    </Typography>
                </Box>
                <ButtonGroup variant="outlined" size="small" sx={{ borderColor: themeVar("border") }}>
                    <Button
                        onClick={() => setViewMode("list")}
                        sx={{
                            bgcolor: viewMode === "list" ? `color-mix(in oklab, ${themeVar("primary")}, transparent 80%)` : "transparent",
                            color: viewMode === "list" ? themeVar("primary") : themeVar("mutedForeground"),
                            borderColor: themeVar("border"),
                            "&:hover": { borderColor: themeVar("border"), bgcolor: `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)` }
                        }}
                        startIcon={<List size={16} />}
                    >
                        List
                    </Button>
                    <Button
                        onClick={() => setViewMode("calendar")}
                        sx={{
                            bgcolor: viewMode === "calendar" ? `color-mix(in oklab, ${themeVar("primary")}, transparent 80%)` : "transparent",
                            color: viewMode === "calendar" ? themeVar("primary") : themeVar("mutedForeground"),
                            borderColor: themeVar("border"),
                            "&:hover": { borderColor: themeVar("border"), bgcolor: `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)` }
                        }}
                        startIcon={<CalendarIcon size={16} />}
                    >
                        Calendar
                    </Button>
                </ButtonGroup>
            </Box>

            {!eventsQuery ? (
                <Typography sx={{ color: themeVar("mutedForeground") }}>Loading events...</Typography>
            ) : eventsQuery.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                    <CalendarIcon size={48} style={{ color: "rgba(255,255,255,0.1)", marginBottom: 16 }} />
                    <Typography variant="h6" sx={{ color: themeVar("mutedForeground"), fontWeight: 700 }}>No Events Scheduled</Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)" }}>Check back later for upcoming activities.</Typography>
                </Box>
            ) : (
                <>
                    {viewMode === "list" ? (
                        <Stack spacing={2} sx={{ maxWidth: 800 }}>
                            {eventsQuery.map(event => {
                                const localStartDate = new Date(event.startTime).toLocaleDateString();
                                const localStartTime = new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const localEndTime = new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                const now = Date.now();
                                const isLive = now >= event.startTime && now <= event.endTime;
                                const isPast = now > event.endTime;

                                return (
                                    <Box
                                        key={event._id}
                                        sx={{
                                            p: 3,
                                            borderRadius: 3,
                                            bgcolor: `color-mix(in oklab, ${themeVar("muted")}, transparent 50%)`,
                                            border: `1px solid ${themeVar("border")}`,
                                            borderLeft: `4px solid ${isLive ? "#22c55e" : isPast ? "rgba(255,255,255,0.1)" : themeVar("primary")}`,
                                            transition: "all 0.2s ease",
                                            opacity: isPast ? 0.6 : 1,
                                            "&:hover": { borderColor: themeVar("primary"), transform: "translateY(-2px)", boxShadow: `0 8px 24px rgba(0,0,0,0.2)` }
                                        }}
                                    >
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                                            <Box>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 800, color: themeVar("foreground") }}>{event.title}</Typography>
                                                    {isLive && (
                                                        <Box sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
                                                            <Typography variant="caption" sx={{ color: "#22c55e", fontWeight: 900, display: "flex", alignItems: "center", gap: 0.5 }}>
                                                                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#22c55e", animation: "pulse 2s infinite" }} /> LIVE
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    {isPast && (
                                                        <Box sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 900 }}>FINISHED</Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                                {event.description && (
                                                    <Typography variant="body2" sx={{ color: themeVar("mutedForeground"), mt: 0.5 }}>{event.description}</Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ textAlign: "right", bgcolor: isPast ? "transparent" : `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)`, px: 2, py: 1, borderRadius: 2, display: "inline-block", border: isPast ? `1px solid ${themeVar("border")}` : "none" }}>
                                                <Typography variant="caption" sx={{ color: isPast ? "rgba(255,255,255,0.4)" : themeVar("primary"), fontWeight: 900, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>{localStartDate}</Typography>
                                                <Typography variant="body2" sx={{ color: isPast ? "rgba(255,255,255,0.4)" : themeVar("foreground"), fontWeight: 700, display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                                                    <Clock size={14} /> {localStartTime} - {localEndTime}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Stack>
                    ) : (
                        <Box sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)",
                            gap: 1,
                            bgcolor: `color-mix(in oklab, ${themeVar("muted")}, transparent 50%)`,
                            border: `1px solid ${themeVar("border")}`,
                            borderRadius: 3,
                            p: 2,
                        }}>
                            {/* Simple minimal calendar logic; can be expanded */}
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                                <Box key={day} sx={{ textAlign: "center", py: 1, borderBottom: `1px solid ${themeVar("border")}` }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: themeVar("mutedForeground"), textTransform: "uppercase" }}>{day}</Typography>
                                </Box>
                            ))}
                            {/* Fill with events (simplified view) */}
                            {Array.from({ length: 35 }).map((_, i) => {
                                // Real calendar math would go here, for now a placeholder grid
                                const dayStr = new Date(Date.now() + i * 86400000).toLocaleDateString();
                                const cellEvents = eventsQuery.filter(e => new Date(e.startTime).toLocaleDateString() === dayStr);

                                return (
                                    <Box key={i} sx={{ minHeight: 100, p: 1, border: `1px solid rgba(255,255,255,0.05)`, borderRadius: 1.5, position: 'relative', overflow: 'hidden' }}>
                                        <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontWeight: 700 }}>
                                            {new Date(Date.now() + i * 86400000).getDate()}
                                        </Typography>
                                        <Stack spacing={0.5} sx={{ mt: 1 }}>
                                            {cellEvents.slice(0, 3).map(e => (
                                                <Typography key={e._id} noWrap variant="caption" sx={{ display: "block", px: 1, py: 0.25, bgcolor: `color-mix(in oklab, ${themeVar("primary")}, transparent 80%)`, color: themeVar("foreground"), borderRadius: 1, fontSize: "0.65rem", fontWeight: 700 }}>
                                                    {e.title}
                                                </Typography>
                                            ))}
                                            {cellEvents.length > 3 && (
                                                <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontSize: "0.6rem", pl: 0.5 }}>+{cellEvents.length - 3} more</Typography>
                                            )}
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
}



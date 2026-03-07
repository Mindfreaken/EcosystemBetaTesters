"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { BarChart3, Hash } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Doc, Id } from "convex/_generated/dataModel";
import { themeVar } from "@/theme/registry";

interface PollsChannelProps {
    channel: Doc<"spaceChannels">;
    spaceId: string;
}

function formatTimeLeft(expiresAt: number | undefined) {
    if (!expiresAt) return null;
    const now = Date.now();
    if (now >= expiresAt) return "Expired";
    const diff = expiresAt - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
    const minutes = Math.floor(diff / (1000 * 60)) % 60;
    if (days > 0) return `Ends in ${days}d ${hours}h`;
    if (hours > 0) return `Ends in ${hours}h ${minutes}m`;
    return `Ends in ${minutes}m`;
}

export default function PollsChannel({ channel, spaceId }: PollsChannelProps) {
    const polls = useQuery(api.spaces.polls.getPolls, { spaceId: spaceId as Id<"spaces"> });
    const voteInPoll = useMutation(api.spaces.polls.vote);
    const markAsRead = useMutation(api.spaces.channels.markChannelAsRead);

    React.useEffect(() => {
        if (polls !== undefined) {
            markAsRead({ channelId: channel._id });
        }
    }, [polls !== undefined, channel._id, markAsRead]);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: themeVar("background"), p: 3, overflowY: "auto" }}>
            <Box sx={{ mb: 4 }}>
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
                    <BarChart3 size={24} style={{ color: themeVar("primary") }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 900, color: themeVar("textLight") }}>
                    #{channel.name}
                </Typography>
                <Typography variant="body2" sx={{ color: themeVar("textSecondary"), display: "block", mt: 0.5 }}>
                    {channel.description || "Cast your votes on community polls."}
                </Typography>
            </Box>

            {!polls ? (
                <Typography sx={{ color: themeVar("textSecondary") }}>Loading polls...</Typography>
            ) : polls.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                    <BarChart3 size={48} style={{ color: "rgba(255,255,255,0.1)", marginBottom: 16 }} />
                    <Typography variant="h6" sx={{ color: themeVar("textSecondary"), fontWeight: 700 }}>No Active Polls</Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)" }}>Check back later for new topics to vote on.</Typography>
                </Box>
            ) : (
                <Stack spacing={3} sx={{ maxWidth: 800 }}>
                    {polls.map(poll => (
                        <Box key={poll._id} sx={{ p: 3, borderRadius: 3, bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 50%)`, border: `1px solid ${themeVar("border")}` }}>
                            <Box sx={{ mb: 2 }}>
                                <Typography sx={{ fontWeight: 800, color: themeVar("textLight"), fontSize: "1.2rem" }}>{poll.question}</Typography>
                                <Typography variant="caption" sx={{ color: themeVar("textSecondary"), display: "block", mt: 0.5 }}>
                                    Created by {poll.creator?.displayName} • {poll.totalVotes} votes
                                    {poll.expiresAt && (
                                        <Box component="span" sx={{ ml: 1, px: 0.8, py: 0.2, bgcolor: poll.expiresAt > Date.now() ? "rgba(255,255,255,0.05)" : "rgba(255,0,0,0.1)", color: poll.expiresAt > Date.now() ? themeVar("textSecondary") : themeVar("danger"), borderRadius: 1, fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            {formatTimeLeft(poll.expiresAt)}
                                        </Box>
                                    )}
                                    {poll.allowMultiSelect ? (
                                        <Box component="span" sx={{ ml: 1, px: 0.8, py: 0.2, bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1, fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            Multi-select
                                        </Box>
                                    ) : (
                                        <Box component="span" sx={{ ml: 1, px: 0.8, py: 0.2, bgcolor: "rgba(255,165,0,0.1)", color: "rgba(255,165,0,0.8)", borderRadius: 1, fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            Votes are final
                                        </Box>
                                    )}
                                </Typography>
                            </Box>

                            <Stack spacing={1.5}>
                                {poll.options.map((option, idx) => {
                                    const voteCount = poll.votes[idx] || 0;
                                    const percentage = poll.totalVotes > 0 ? (voteCount / poll.totalVotes) * 100 : 0;
                                    const isMyVote = poll.myVoteIndices?.includes(idx);
                                    const isExpired = poll.expiresAt ? Date.now() > poll.expiresAt : false;
                                    const locked = isExpired || (!poll.allowMultiSelect ? (poll.myVoteIndices?.length || 0) > 0 : isMyVote);

                                    return (
                                        <Box
                                            key={idx}
                                            onClick={() => !locked && voteInPoll({ pollId: poll._id, optionIndex: idx })}
                                            sx={{
                                                cursor: locked ? "default" : "pointer",
                                                position: "relative",
                                                p: 2,
                                                borderRadius: 2,
                                                border: `1px solid ${isMyVote ? themeVar("primary") : "rgba(255,255,255,0.05)"}`,
                                                bgcolor: isMyVote ? `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)` : "rgba(0,0,0,0.15)",
                                                overflow: "hidden",
                                                transition: "all 0.2s ease",
                                                opacity: locked && !isMyVote ? 0.7 : 1,
                                                "&:hover": { bgcolor: locked ? (isMyVote ? `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)` : "rgba(0,0,0,0.15)") : (isMyVote ? `color-mix(in oklab, ${themeVar("primary")}, transparent 85%)` : "rgba(255,255,255,0.02)") }
                                            }}
                                        >
                                            {/* Percentage Bar */}
                                            <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${percentage}%`, bgcolor: isMyVote ? `color-mix(in oklab, ${themeVar("primary")}, transparent 70%)` : "rgba(255,255,255,0.03)", transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)", zIndex: 0 }} />

                                            <Box sx={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="body2" sx={{ fontWeight: isMyVote ? 800 : 500, color: isMyVote ? themeVar("primary") : themeVar("textLight") }}>
                                                    {option}
                                                </Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: isMyVote ? themeVar("primary") : themeVar("textSecondary") }}>
                                                    {Math.round(percentage)}% ({voteCount})
                                                </Typography>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                    ))}
                </Stack>
            )}
        </Box>
    );
}

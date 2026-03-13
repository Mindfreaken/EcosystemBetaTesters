"use client";
// Space polls management component

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { Plus, BarChart3, Trash2, Info, PlusCircle, XCircle, Megaphone, Clock, X } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id, Doc } from "convex/_generated/dataModel";
import { themeVar } from "@/theme/registry";

interface PollsTabProps {
    space: Doc<"spaces">;
    role: "owner" | "admin" | "moderator";
    userRole?: string;
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

export function PollsTab({ space, role, userRole }: PollsTabProps) {
    const polls = useQuery(api.spaces.polls.getPolls, { spaceId: space._id });
    const createPoll = useMutation(api.spaces.polls.createPoll);
    const deletePoll = useMutation(api.spaces.polls.deletePoll);
    const voteInPoll = useMutation(api.spaces.polls.vote);

    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [question, setQuestion] = React.useState("");
    const [options, setOptions] = React.useState(["", ""]);
    const [showInAnnouncements, setShowInAnnouncements] = React.useState(true);
    const [allowMultiSelect, setAllowMultiSelect] = React.useState(false);
    const [endDate, setEndDate] = React.useState("");
    const [pollToDelete, setPollToDelete] = React.useState<Id<"spacePolls"> | null>(null);

    const canCreate = role === "owner" || (role === "admin" && space.adminCanCreatePolls !== false) || (role === "moderator" && space.modCanCreatePolls);

    const handleAddOption = () => {
        if (options.length < 10) {
            setOptions([...options, ""]);
        }
    };

    const handleRemoveOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const handleCreate = async () => {
        if (!question.trim() || options.filter(o => o.trim()).length < 2) return;

        const expiresAt = endDate ? new Date(endDate).getTime() : undefined;

        await createPoll({
            spaceId: space._id,
            question,
            options: options.filter(o => o.trim()),
            allowMultiSelect,
            showInAnnouncements,
            expiresAt,
        });

        setIsCreateOpen(false);
        setQuestion("");
        setOptions(["", ""]);
        setAllowMultiSelect(false);
        setEndDate("");
    };

    const handleDelete = async () => {
        if (pollToDelete) {
            await deletePoll({ pollId: pollToDelete });
            setPollToDelete(null);
        }
    };

    const renderToggle = (label: string, value: boolean, onChange: () => void) => (
        <Box
            onClick={onChange}
            sx={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                p: 2, borderRadius: 3,
                bgcolor: "rgba(0,0,0,0.15)",
                border: `1px solid ${value ? `color-mix(in oklab, ${themeVar("primary")}, transparent 70%)` : "rgba(255,255,255,0.05)"}`,
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                    bgcolor: "rgba(0,0,0,0.25)",
                    borderColor: value ? themeVar("primary") : "rgba(255,255,255,0.15)",
                }
            }}
        >
            <Typography variant="body2" sx={{ color: themeVar("foreground"), fontWeight: 600 }}>{label}</Typography>
            <Box
                sx={{
                    width: 44, height: 24, borderRadius: 12,
                    bgcolor: value ? themeVar("primary") : "rgba(255,255,255,0.1)",
                    position: "relative",
                    transition: "background-color 0.3s ease"
                }}
            >
                <Box
                    sx={{
                        width: 18, height: 18, borderRadius: "50%",
                        bgcolor: "white",
                        position: "absolute", top: 3,
                        left: value ? 23 : 3,
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                />
            </Box>
        </Box>
    );

    return (
        <Box sx={{ maxWidth: 800 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("mutedForeground") }}>POLLS & SURVEYS</Typography>
                {canCreate && (
                    <Button
                        size="small"
                        startIcon={<Plus size={14} />}
                        onClick={() => setIsCreateOpen(true)}
                        sx={{ color: themeVar("primary"), fontWeight: 700, textTransform: "none" }}
                    >
                        Create Poll
                    </Button>
                )}
            </Box>

            <Box sx={{ p: 4, borderRadius: 3, bgcolor: `color-mix(in oklab, ${themeVar("muted")}, transparent 50%)`, border: `1px solid ${themeVar("border")}` }}>
                {polls === undefined ? (
                    <Typography sx={{ color: themeVar("mutedForeground"), textAlign: "center" }}>Loading polls...</Typography>
                ) : polls.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <BarChart3 size={48} style={{ color: "rgba(255,255,255,0.1)", marginBottom: 16 }} />
                        <Typography sx={{ color: themeVar("mutedForeground"), display: "block" }}>No polls active.</Typography>
                    </Box>
                ) : (
                    <Stack spacing={3}>
                        {polls.map(poll => (
                            <Box key={poll._id} sx={{ p: 2.5, borderRadius: 2, bgcolor: "rgba(0,0,0,0.2)", border: `1px solid ${themeVar("border")}` }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                                    <Box>
                                        <Typography sx={{ fontWeight: 800, color: themeVar("foreground"), fontSize: "1.1rem" }}>{poll.question}</Typography>
                                        <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), display: "block", mt: 0.5 }}>
                                            Created by {poll.creator?.displayName} • {poll.totalVotes} votes
                                            {poll.expiresAt && (
                                                <Box component="span" sx={{ ml: 1, px: 0.8, py: 0.2, bgcolor: poll.expiresAt > Date.now() ? "rgba(255,255,255,0.05)" : "rgba(255,0,0,0.1)", color: poll.expiresAt > Date.now() ? themeVar("mutedForeground") : themeVar("destructive"), borderRadius: 1, fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                    {formatTimeLeft(poll.expiresAt)}
                                                </Box>
                                            )}
                                        </Typography>
                                    </Box>
                                    {(role === "owner" || role === "admin" || poll.creatorId === (poll as any).myUserId) && (
                                        <IconButton size="small" onClick={() => setPollToDelete(poll._id)} sx={{ color: themeVar("destructive"), "&:hover": { bgcolor: "rgba(255,0,0,0.1)" } }}>
                                            <Trash2 size={16} />
                                        </IconButton>
                                    )}
                                </Box>

                                <Stack spacing={1.5}>
                                    {poll.options.map((option, idx) => {
                                        const voteCount = poll.votes[idx] || 0;
                                        const percentage = poll.totalVotes > 0 ? (voteCount / poll.totalVotes) * 100 : 0;
                                        const isMyVote = poll.myVoteIndices?.includes(idx);
                                        const isExpired = poll.expiresAt ? Date.now() > poll.expiresAt : false;
                                        const locked = isExpired || (!poll.allowMultiSelect ? poll.myVoteIndices?.length > 0 : isMyVote);

                                        return (
                                            <Box
                                                key={idx}
                                                onClick={() => !locked && voteInPoll({ pollId: poll._id, optionIndex: idx })}
                                                sx={{
                                                    cursor: locked ? "default" : "pointer",
                                                    position: "relative",
                                                    p: 1.5,
                                                    borderRadius: 1.5,
                                                    border: `1px solid ${isMyVote ? themeVar("primary") : "rgba(255,255,255,0.05)"}`,
                                                    bgcolor: isMyVote ? `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)` : "rgba(0,0,0,0.15)",
                                                    overflow: "hidden",
                                                    opacity: locked && !isMyVote ? 0.7 : 1,
                                                    "&:hover": { bgcolor: locked ? (isMyVote ? `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)` : "rgba(0,0,0,0.15)") : (isMyVote ? `color-mix(in oklab, ${themeVar("primary")}, transparent 85%)` : "rgba(255,255,255,0.02)") }
                                                }}
                                            >
                                                {/* Percentage Bar */}
                                                <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${percentage}%`, bgcolor: isMyVote ? `color-mix(in oklab, ${themeVar("primary")}, transparent 70%)` : "rgba(255,255,255,0.03)", transition: "width 0.3s ease", zIndex: 0 }} />

                                                <Box sx={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <Typography variant="body2" sx={{ fontWeight: isMyVote ? 700 : 500, color: isMyVote ? themeVar("primary") : themeVar("foreground") }}>
                                                        {option}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: isMyVote ? themeVar("primary") : themeVar("mutedForeground") }}>
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

            <Dialog
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                fullWidth
                maxWidth="xs"
                slotProps={{
                    backdrop: {
                        sx: {
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            backdropFilter: 'blur(4px)',
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
                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                        width: "100%",
                        maxWidth: 500
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 900,
                        color: themeVar("foreground"),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        pb: 1,
                        px: 3,
                        pt: 2.5
                    }}
                >
                    Create New Poll
                    <IconButton
                        size="small"
                        onClick={() => setIsCreateOpen(false)}
                        sx={{
                            color: themeVar("mutedForeground"),
                            "&:hover": { color: themeVar("foreground"), background: "transparent" },
                        }}
                    >
                        <X size={18} />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Stack spacing={2.5} sx={{ py: 1 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Question"
                            placeholder="e.g. What's our next event theme?"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                                sx: { color: themeVar("foreground"), fontWeight: 700, "&.Mui-focused": { color: themeVar("primary") } }
                            }}
                            InputProps={{
                                sx: {
                                    color: themeVar("foreground"),
                                    bgcolor: "rgba(0,0,0,0.3)",
                                    borderRadius: 2,
                                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("primary"), borderWidth: 2 }
                                }
                            }}
                        />

                        <Box>
                            <Typography variant="overline" sx={{ fontWeight: 900, color: themeVar("mutedForeground"), display: "block", mb: 1, ml: 0.5 }}>OPTIONS</Typography>
                            <Stack spacing={1.5}>
                                {options.map((opt, i) => (
                                    <Box key={i} sx={{ display: "flex", gap: 1 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder={`Option ${i + 1}`}
                                            value={opt}
                                            onChange={(e) => {
                                                const newOpts = [...options];
                                                newOpts[i] = e.target.value;
                                                setOptions(newOpts);
                                            }}
                                            InputProps={{
                                                sx: {
                                                    color: themeVar("foreground"),
                                                    bgcolor: "rgba(0,0,0,0.2)",
                                                    borderRadius: 1.5,
                                                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.05)" },
                                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("primary") }
                                                }
                                            }}
                                        />
                                        <IconButton
                                            onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                                            disabled={options.length <= 2}
                                            sx={{ color: themeVar("destructive"), opacity: options.length <= 2 ? 0.3 : 0.7 }}
                                        >
                                            <Trash2 size={16} />
                                        </IconButton>
                                    </Box>
                                ))}
                                <Button
                                    size="small"
                                    startIcon={<Plus size={16} />}
                                    onClick={() => setOptions([...options, ""])}
                                    sx={{ alignSelf: "flex-start", color: themeVar("primary"), fontWeight: 700, textTransform: "none" }}
                                >
                                    Add Option
                                </Button>
                            </Stack>
                        </Box>

                        <TextField
                            fullWidth
                            size="small"
                            label="End Time (Optional)"
                            type="datetime-local"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                                sx: { color: themeVar("foreground"), fontWeight: 700, "&.Mui-focused": { color: themeVar("primary") } }
                            }}
                            InputProps={{
                                sx: {
                                    color: themeVar("foreground"),
                                    bgcolor: "rgba(0,0,0,0.3)",
                                    borderRadius: 2,
                                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("primary"), borderWidth: 2 },
                                    "& [type='datetime-local']::-webkit-calendar-picker-indicator": { filter: "invert(1)" }
                                }
                            }}
                        />

                        {renderToggle("Announce in #announcements", showInAnnouncements, () => setShowInAnnouncements(!showInAnnouncements))}
                        {renderToggle("Allow Multiple Choices", allowMultiSelect, () => setAllowMultiSelect(!allowMultiSelect))}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
                    <Button
                        onClick={() => setIsCreateOpen(false)}
                        sx={{ color: themeVar("mutedForeground"), fontWeight: 700, textTransform: "none" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCreate}
                        disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
                        sx={{
                            bgcolor: themeVar("primary"),
                            color: "white",
                            fontWeight: 900,
                            px: 3,
                            borderRadius: 2,
                            textTransform: "none",
                            "&:hover": { bgcolor: themeVar("primary"), filter: "brightness(1.1)" }
                        }}
                    >
                        Create Poll
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={Boolean(pollToDelete)}
                onClose={() => setPollToDelete(null)}
                PaperProps={{
                    sx: {
                        bgcolor: themeVar("background"),
                        color: themeVar("foreground"),
                        backgroundImage: "none",
                        border: `1px solid ${themeVar("border")}`,
                        borderRadius: 3
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 900 }}>Delete Poll?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: themeVar("mutedForeground") }}>
                        Are you sure you want to delete this poll? This action cannot be undone and all associated votes will be lost.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setPollToDelete(null)} sx={{ color: themeVar("mutedForeground"), fontWeight: 700 }}>Cancel</Button>
                    <Button
                        onClick={handleDelete}
                        variant="contained"
                        color="error"
                        sx={{ fontWeight: 800, px: 3, borderRadius: 2 }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}



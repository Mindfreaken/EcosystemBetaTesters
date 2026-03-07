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
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import { Plus, BarChart3, Trash2, Info, PlusCircle, XCircle, Megaphone, Clock } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id, Doc } from "convex/_generated/dataModel";
import { themeVar } from "@/theme/registry";

interface PollsTabProps {
    space: Doc<"spaces">;
    role: "owner" | "admin" | "moderator";
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

export function PollsTab({ space, role }: PollsTabProps) {
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

    return (
        <Box sx={{ maxWidth: 800 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("textSecondary") }}>POLLS & SURVEYS</Typography>
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

            <Box sx={{ p: 4, borderRadius: 3, bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 50%)`, border: `1px solid ${themeVar("border")}` }}>
                {polls === undefined ? (
                    <Typography sx={{ color: themeVar("textSecondary"), textAlign: "center" }}>Loading polls...</Typography>
                ) : polls.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <BarChart3 size={48} style={{ color: "rgba(255,255,255,0.1)", marginBottom: 16 }} />
                        <Typography sx={{ color: themeVar("textSecondary"), display: "block" }}>No polls active.</Typography>
                    </Box>
                ) : (
                    <Stack spacing={3}>
                        {polls.map(poll => (
                            <Box key={poll._id} sx={{ p: 2.5, borderRadius: 2, bgcolor: "rgba(0,0,0,0.2)", border: `1px solid ${themeVar("border")}` }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                                    <Box>
                                        <Typography sx={{ fontWeight: 800, color: themeVar("textLight"), fontSize: "1.1rem" }}>{poll.question}</Typography>
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
                                    {(role === "owner" || role === "admin" || poll.creatorId === (poll as any).myUserId) && (
                                        <IconButton size="small" onClick={() => setPollToDelete(poll._id)} sx={{ color: themeVar("danger"), "&:hover": { bgcolor: "rgba(255,0,0,0.1)" } }}>
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
                                                    <Typography variant="body2" sx={{ fontWeight: isMyVote ? 700 : 500, color: isMyVote ? themeVar("primary") : themeVar("textLight") }}>
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

            <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: themeVar("backgroundAlt"), color: themeVar("textLight"), backgroundImage: "none" } }}>
                <DialogTitle sx={{ fontWeight: 900 }}>Create New Poll</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            label="Question"
                            fullWidth
                            multiline
                            rows={2}
                            value={question}
                            onChange={e => setQuestion(e.target.value)}
                            InputLabelProps={{ sx: { color: themeVar("textSecondary") } }}
                            InputProps={{
                                sx: {
                                    color: themeVar("textLight"),
                                    '.MuiOutlinedInput-notchedOutline': { borderColor: "rgba(255,255,255,0.2)" },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: "rgba(255,255,255,0.3)" },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: themeVar("primary") }
                                }
                            }}
                        />

                        <Box sx={{ position: "relative", width: "100%" }}>
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<Clock size={16} />}
                                sx={{
                                    color: themeVar("textLight"),
                                    borderColor: "rgba(255,255,255,0.2)",
                                    "&:hover": { borderColor: themeVar("primary") },
                                    justifyContent: "flex-start",
                                    textTransform: "none",
                                    fontWeight: 600,
                                    py: 1
                                }}
                            >
                                {endDate ? `Ends: ${new Date(endDate).toLocaleString()}` : "Set End Time (Optional)"}
                            </Button>
                            <Box
                                component="input"
                                type="datetime-local"
                                value={endDate}
                                onChange={(e: any) => setEndDate(e.target.value)}
                                sx={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    opacity: 0,
                                    cursor: "pointer",
                                    "&::-webkit-calendar-picker-indicator": {
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        cursor: "pointer",
                                        background: "transparent"
                                    }
                                }}
                            />
                        </Box>

                        <Typography variant="caption" sx={{ color: themeVar("textSecondary"), fontWeight: 800, mb: -2 }}>OPTIONS</Typography>
                        <Stack spacing={1}>
                            {options.map((opt, i) => (
                                <Box key={i} sx={{ display: "flex", gap: 1 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder={`Option ${i + 1}`}
                                        value={opt}
                                        onChange={e => {
                                            const newOptions = [...options];
                                            newOptions[i] = e.target.value;
                                            setOptions(newOptions);
                                        }}
                                        InputProps={{
                                            sx: {
                                                color: themeVar("textLight"),
                                                '.MuiOutlinedInput-notchedOutline': { borderColor: "rgba(255,255,255,0.2)" },
                                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: "rgba(255,255,255,0.3)" },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: themeVar("primary") }
                                            }
                                        }}
                                    />
                                    {options.length > 2 && (
                                        <IconButton size="small" onClick={() => handleRemoveOption(i)} sx={{ color: themeVar("danger") }}>
                                            <XCircle size={18} />
                                        </IconButton>
                                    )}
                                </Box>
                            ))}
                            {options.length < 10 && (
                                <Button size="small" startIcon={<PlusCircle size={14} />} onClick={handleAddOption} sx={{ alignSelf: "flex-start", color: themeVar("primary"), textTransform: "none" }}>
                                    Add Option
                                </Button>
                            )}
                        </Stack>

                        <Stack spacing={1} direction="row">
                            <FormControlLabel
                                control={<Checkbox checked={showInAnnouncements} onChange={e => setShowInAnnouncements(e.target.checked)} sx={{ color: themeVar("primary"), '&.Mui-checked': { color: themeVar("primary") } }} />}
                                label={<Typography variant="body2" sx={{ color: themeVar("textSecondary"), display: "flex", alignItems: "center", gap: 1 }}><Megaphone size={14} /> Announce</Typography>}
                            />
                            <FormControlLabel
                                control={<Checkbox checked={allowMultiSelect} onChange={e => setAllowMultiSelect(e.target.checked)} sx={{ color: themeVar("primary"), '&.Mui-checked': { color: themeVar("primary") } }} />}
                                label={<Typography variant="body2" sx={{ color: themeVar("textSecondary"), display: "flex", alignItems: "center", gap: 1 }}>Allow multiple answers</Typography>}
                            />
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsCreateOpen(false)} sx={{ color: themeVar("textSecondary") }}>Cancel</Button>
                    <Button onClick={handleCreate} variant="contained" disabled={!question.trim() || options.filter(o => o.trim()).length < 2} sx={{ bgcolor: themeVar("primary") }}>
                        Create Poll
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={Boolean(pollToDelete)}
                onClose={() => setPollToDelete(null)}
                PaperProps={{ sx: { bgcolor: themeVar("backgroundAlt"), color: themeVar("textLight"), backgroundImage: "none", border: `1px solid ${themeVar("border")}`, borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 900 }}>Delete Poll?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: themeVar("textSecondary") }}>
                        Are you sure you want to delete this poll? This action cannot be undone and all associated votes will be lost.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setPollToDelete(null)} sx={{ color: themeVar("textSecondary"), fontWeight: 700 }}>Cancel</Button>
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

"use client";

import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import { Send, Hash, Smile, Trash2, Shield, Clock, Ban, FileText, ExternalLink, AlertTriangle, MessageSquare, CheckCheck } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { themeVar } from "@/theme/registry";
import { Doc, Id } from "convex/_generated/dataModel";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";
import { EMOJI_CATEGORIES } from "@/constants/emojis";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import MemberNotesDialog from "./MemberNotesDialog";

const COMMON_EMOJIS = ["👍", "❤️", "😂", "🔥", "😮", "🚀"];

interface ChannelChatProps {
    channel: Doc<"spaceChannels">;
    userRole?: string | null;
}

export default function ChannelChat({ channel, userRole = "member" }: ChannelChatProps) {
    const [input, setInput] = useState("");
    const listRef = useRef<HTMLDivElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const hasInitScrollRef = useRef(false);

    // Current user
    const me = useQuery(api.users.onboarding.queries.me, {});

    // Messages for selected channel
    const messages = useQuery(api.spaces.messages.getChannelMessages, { channelId: channel._id });

    // Custom emojis for this space
    const customEmojis = useQuery(api.spaces.emojis.getSpaceCustomEmojis, { spaceId: channel.spaceId });

    // Current space
    const space = useQuery(api.spaces.core.getSpace, { spaceId: channel.spaceId });

    // Current user membership
    const membership = useQuery(api.spaces.members.getSpaceMember, { spaceId: channel.spaceId, userId: me?._id as Id<"users"> });

    // Auto-scroll logic
    useLayoutEffect(() => {
        if (!listRef.current || !bottomRef.current || !messages) return;

        if (!hasInitScrollRef.current) {
            hasInitScrollRef.current = true;
            bottomRef.current.scrollIntoView({ behavior: "auto", block: "end" });
            return;
        }

        const el = listRef.current;
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        const NEAR_BOTTOM_PX = 150;

        if (distanceFromBottom <= NEAR_BOTTOM_PX) {
            requestAnimationFrame(() => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            });
        }
    }, [messages?.length]);

    useEffect(() => {
        hasInitScrollRef.current = false;
    }, [channel._id]);

    const markAsRead = useMutation(api.spaces.channels.markChannelAsRead);

    // Mark as read when new messages arrive while viewing
    useEffect(() => {
        if (messages && messages.length > 0) {
            markAsRead({ channelId: channel._id });
        }
    }, [messages?.length, channel._id, markAsRead]);

    const sendMessage = useMutation(api.spaces.messages.sendChannelMessage);
    const toggleReaction = useMutation(api.spaces.messages.toggleChannelMessageReaction);
    const deleteMessage = useMutation(api.spaces.messages.deleteChannelMessage);
    const isDocumentChannel = channel.name.toLowerCase() === "rules";

    const timeoutUserMut = useMutation(api.spaces.moderation.timeoutUser);
    const banUserMut = useMutation(api.spaces.moderation.banUser);
    const bulkDeleteMut = useMutation(api.spaces.messages.bulkDeleteUserMessages);

    // Evaluate if user can post in read-only channels based on space settings
    let isReadOnlyForMe = false;
    if (channel.isReadOnly) {
        const isAdmin = userRole === "admin";
        const isMod = userRole === "moderator";
        const isOwner = userRole === "owner";

        const canPost = isOwner ||
            (isAdmin && (space?.adminCanPostInReadOnly ?? false)) ||
            (isMod && (space?.modCanPostInReadOnly ?? false));

        isReadOnlyForMe = !canPost;
    }

    const isTimedOut = membership?.timeoutUntil && membership.timeoutUntil > Date.now();
    const canSend = !!me && input.trim().length > 0 && !isReadOnlyForMe && !isTimedOut;

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [activeMsgId, setActiveMsgId] = useState<Id<"spaceChannelMessages"> | null>(null);
    const [modMenuAnchor, setModMenuAnchor] = useState<{ el: HTMLElement, msgId: Id<"spaceChannelMessages">, userId: Id<"users">, username: string, avatarUrl?: string } | null>(null);
    const [modDialogOpen, setModDialogOpen] = useState(false);
    const [modActionType, setModActionType] = useState<"timeout" | "ban" | "delete_messages" | null>(null);
    const [timeoutHours, setTimeoutHours] = useState(1);
    const [deleteCount, setDeleteCount] = useState<number | "all" | "this">(0);
    const [deleteScope, setDeleteScope] = useState<"channel" | "space">("channel");
    const [isProcessingMod, setIsProcessingMod] = useState(false);
    const [notesDialogOpen, setNotesDialogOpen] = useState(false);
    const [externalLink, setExternalLink] = useState<{ url: string, text: string } | null>(null);

    const handleReactionClick = (event: React.MouseEvent<HTMLElement>, msgId: Id<"spaceChannelMessages">) => {
        setAnchorEl(event.currentTarget);
        setActiveMsgId(msgId);
    };

    const handleEmojiSelect = async (emoji: string) => {
        if (!activeMsgId) return;
        try {
            await toggleReaction({ messageId: activeMsgId, reaction: emoji });
        } catch (e) {
            console.error("Failed to toggle reaction", e);
        }
        setAnchorEl(null);
        setActiveMsgId(null);
    };

    const handleSend = async () => {
        if (!canSend) return;
        const content = input.trim();
        try {
            await sendMessage({
                channelId: channel._id,
                content,
            });
            setInput("");
            markAsRead({ channelId: channel._id });
        } catch (e) {
            console.error("Failed to send message", e);
        }
    };

    const handleModActionConfirm = async () => {
        if (!modMenuAnchor || !modActionType) return;
        setIsProcessingMod(true);
        try {
            if (modActionType === "timeout") {
                await timeoutUserMut({
                    spaceId: channel.spaceId,
                    userId: modMenuAnchor.userId,
                    timeoutUntil: Date.now() + (timeoutHours * 60 * 60 * 1000)
                });
            } else if (modActionType === "ban") {
                await banUserMut({
                    spaceId: channel.spaceId,
                    userId: modMenuAnchor.userId,
                });
            }

            if (deleteCount !== 0 || modActionType === "delete_messages") {
                if (deleteCount === "this") {
                    await deleteMessage({ messageId: modMenuAnchor.msgId });
                } else {
                    await bulkDeleteMut({
                        spaceId: channel.spaceId,
                        userId: modMenuAnchor.userId,
                        channelId: deleteScope === "channel" ? channel._id : undefined,
                        limit: deleteCount === "all" ? undefined : (deleteCount === 0 && modActionType === "delete_messages" ? 5 : deleteCount)
                    });
                }
            }

            setModDialogOpen(false);
            setModMenuAnchor(null);
            setModActionType(null);
        } catch (e: any) {
            console.error("Failed to execute moderation action", e);
            alert(e.message);
        } finally {
            setIsProcessingMod(false);
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: themeVar("background") }}>
            {/* Messages area */}
            <Box
                ref={listRef}
                sx={{
                    flex: 1,
                    overflowY: "auto",
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    "&::-webkit-scrollbar": { width: 8 },
                    "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.1)", borderRadius: 4 },
                }}
            >
                {!messages ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <Typography sx={{ color: themeVar("textSecondary") }}>Loading messages...</Typography>
                    </Box>
                ) : messages.length === 0 ? (
                    isDocumentChannel ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                            <Typography sx={{ color: themeVar("textSecondary") }}>No document content available.</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ mt: "auto", mb: 4, px: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, opacity: 0.4 }}>
                            <Box sx={{ width: 40, height: 1, bgcolor: themeVar("border") }} />
                            <Typography variant="caption" sx={{ color: themeVar("textSecondary"), fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", fontSize: "0.65rem" }}>
                                No messages yet
                            </Typography>
                        </Box>
                    )
                ) : (
                    <>
                        {!isDocumentChannel && (
                            <Box sx={{ mb: 3, pt: 4, display: "flex", alignItems: "center", gap: 2, opacity: 0.35 }}>
                                <Box sx={{ flex: 1, height: 1, bgcolor: themeVar("border") }} />
                                <Typography variant="caption" sx={{ color: themeVar("textSecondary"), fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", fontSize: "0.6rem", whiteSpace: "nowrap" }}>
                                    Start of {channel.name}
                                </Typography>
                                <Box sx={{ flex: 1, height: 1, bgcolor: themeVar("border") }} />
                            </Box>
                        )}

                        {messages.map((m) => {
                            const isMine = !!me && m.senderId === me._id;
                            const timeLabel = new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                            // Group reactions
                            const groupedReactions = m.reactions?.reduce((acc: any, curr: any) => {
                                acc[curr.reaction] = (acc[curr.reaction] || []);
                                acc[curr.reaction].push(curr.userId);
                                return acc;
                            }, {});

                            const canMod = (userRole ? ["owner", "admin", "moderator"].includes(userRole) : false) && m.senderId !== me?._id;
                            const canDelete = isMine || canMod;

                            return (
                                <Box key={m._id} sx={{
                                    display: "flex",
                                    gap: 2,
                                    "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    position: "relative",
                                    "&:hover .message-actions": { opacity: 1 }
                                }}>
                                    {!isDocumentChannel && (
                                        <Avatar
                                            src={m.sender?.avatarUrl}
                                            sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: themeVar("backgroundAlt") }}
                                        >
                                            {m.sender?.displayName?.[0]}
                                        </Avatar>
                                    )}
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        {!isDocumentChannel && (
                                            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 0.5 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <Typography sx={{ fontWeight: 800, color: isMine ? themeVar("primary") : themeVar("textLight"), fontSize: "0.95rem" }}>
                                                        {m.sender?.displayName || "Unknown User"}
                                                    </Typography>
                                                    {m.sender?.timeoutUntil && m.sender.timeoutUntil > Date.now() && (
                                                        <Tooltip title="Timed Out" arrow>
                                                            <Box sx={{ display: "flex", alignItems: "center", color: themeVar("warning") }}>
                                                                <Clock size={14} />
                                                            </Box>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                                <Typography variant="caption" sx={{ color: themeVar("textSecondary"), fontSize: "0.75rem" }}>
                                                    {timeLabel}
                                                </Typography>
                                            </Box>
                                        )}
                                        <MarkdownText
                                            content={m.content}
                                            onLinkClick={(url, text) => setExternalLink({ url, text })}
                                        />

                                        {/* Reactions Display */}
                                        {groupedReactions && Object.keys(groupedReactions).length > 0 && (
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                                                {Object.entries(groupedReactions).map(([emoji, userIds]: [string, any]) => {
                                                    const hasReacted = !!me && userIds.includes(me._id);
                                                    const isCustom = emoji.startsWith("http") || emoji.length > 2; // Simple check for custom emoji URL or ID

                                                    return (
                                                        <Tooltip key={emoji} title={`${userIds.length} reaction${userIds.length > 1 ? "s" : ""}`} arrow>
                                                            <Box
                                                                onClick={() => toggleReaction({ messageId: m._id, reaction: emoji })}
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: 0.5,
                                                                    px: 0.75,
                                                                    py: 0.25,
                                                                    borderRadius: 1.5,
                                                                    bgcolor: hasReacted ? `color-mix(in oklab, ${themeVar("primary")}, transparent 80%)` : "rgba(255,255,255,0.05)",
                                                                    border: `1px solid ${hasReacted ? themeVar("primary") : "transparent"}`,
                                                                    cursor: "pointer",
                                                                    transition: "all 0.2s",
                                                                    "&:hover": { bgcolor: hasReacted ? `color-mix(in oklab, ${themeVar("primary")}, transparent 70%)` : "rgba(255,255,255,0.1)" }
                                                                }}
                                                            >
                                                                {isCustom ? (
                                                                    <img src={emoji} alt="reaction" style={{ width: 16, height: 16, objectFit: "contain" }} />
                                                                ) : (
                                                                    <Typography sx={{ fontSize: "0.85rem" }}>{emoji}</Typography>
                                                                )}
                                                                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: hasReacted ? themeVar("primary") : themeVar("textSecondary") }}>
                                                                    {userIds.length}
                                                                </Typography>
                                                            </Box>
                                                        </Tooltip>
                                                    );
                                                })}
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Inline Actions (on hover) */}
                                    <Box className="message-actions" sx={{
                                        position: "absolute",
                                        top: -12,
                                        right: 16,
                                        bgcolor: themeVar("backgroundAlt"),
                                        border: `1px solid ${themeVar("border")}`,
                                        borderRadius: 2,
                                        display: "flex",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                                        opacity: 0,
                                        transition: "opacity 0.2s",
                                        p: 0.5,
                                        zIndex: 1
                                    }}>
                                        <IconButton size="small" onClick={(e) => handleReactionClick(e, m._id)} sx={{ color: themeVar("textSecondary"), "&:hover": { color: themeVar("primary") } }}>
                                            <Smile size={18} />
                                        </IconButton>
                                        {canMod && (
                                            <IconButton
                                                size="small"
                                                onClick={(e) => setModMenuAnchor({ el: e.currentTarget, msgId: m._id, userId: m.senderId, username: m.sender?.displayName || "User", avatarUrl: m.sender?.avatarUrl })}
                                                sx={{ color: themeVar("textSecondary"), "&:hover": { color: themeVar("warning") } }}
                                            >
                                                <Shield size={18} />
                                            </IconButton>
                                        )}
                                        {canDelete && (
                                            <IconButton
                                                size="small"
                                                onClick={() => deleteMessage({ messageId: m._id })}
                                                sx={{ color: themeVar("textSecondary"), "&:hover": { color: themeVar("danger") } }}
                                            >
                                                <Trash2 size={18} />
                                            </IconButton>
                                        )}
                                    </Box>
                                </Box>
                            );
                        })}

                        {/* Full Emoji Picker Popover */}
                        <EmojiPickerPopover
                            anchorEl={anchorEl}
                            onClose={() => setAnchorEl(null)}
                            onSelect={handleEmojiSelect}
                            customEmojis={customEmojis}
                        />

                        {/* Mod Actions Menu */}
                        <Menu
                            anchorEl={modMenuAnchor?.el}
                            open={Boolean(modMenuAnchor)}
                            onClose={() => setModMenuAnchor(null)}
                            PaperProps={{
                                sx: {
                                    bgcolor: themeVar("backgroundAlt"),
                                    border: `1px solid ${themeVar("border")}`,
                                    color: themeVar("textLight"),
                                    minWidth: 160
                                }
                            }}
                        >
                            <MenuItem onClick={() => { setModActionType("timeout"); setTimeoutHours(1); setModDialogOpen(true); setModMenuAnchor(prev => prev ? { ...prev, el: prev.el } : null); setAnchorEl(null); }} sx={{ gap: 1.5, fontSize: "0.875rem", "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}>
                                <Clock size={16} /> Timeout (1 Hour)
                            </MenuItem>
                            <MenuItem onClick={() => { setNotesDialogOpen(true); setModMenuAnchor(prev => prev ? { ...prev, el: prev.el } : null); setAnchorEl(null); }} sx={{ gap: 1.5, fontSize: "0.875rem", "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}>
                                <FileText size={16} /> Staff Notes
                            </MenuItem>
                            <MenuItem onClick={() => { setModActionType("timeout"); setTimeoutHours(24); setModDialogOpen(true); setModMenuAnchor(prev => prev ? { ...prev, el: prev.el } : null); setAnchorEl(null); }} sx={{ gap: 1.5, fontSize: "0.875rem", "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}>
                                <Clock size={16} /> Timeout (24 Hours)
                            </MenuItem>
                            <MenuItem onClick={() => { setModActionType("ban"); setModDialogOpen(true); setModMenuAnchor(prev => prev ? { ...prev, el: prev.el } : null); setAnchorEl(null); }} sx={{ gap: 1.5, fontSize: "0.875rem", color: themeVar("danger"), "&:hover": { bgcolor: "rgba(255,0,0,0.1)" } }}>
                                <Ban size={16} /> Ban User
                            </MenuItem>
                            <MenuItem onClick={() => { setModActionType("delete_messages"); setDeleteCount(5); setModDialogOpen(true); setModMenuAnchor(prev => prev ? { ...prev, el: prev.el } : null); setAnchorEl(null); }} sx={{ gap: 1.5, fontSize: "0.875rem", "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}>
                                <Trash2 size={16} /> Delete Messages
                            </MenuItem>
                        </Menu>

                        {/* Moderation Confirmation Dialog */}
                        <Dialog open={modDialogOpen} onClose={() => !isProcessingMod && setModDialogOpen(false)} PaperProps={{ sx: { bgcolor: themeVar("backgroundAlt"), color: themeVar("textLight"), backgroundImage: 'none', border: `1px solid ${themeVar("border")}`, borderRadius: 4, minWidth: 400 } }}>
                            <DialogTitle sx={{ fontWeight: 900 }}>
                                {modActionType === "timeout" ? `Timeout ${modMenuAnchor?.username}` : modActionType === "ban" ? `Ban ${modMenuAnchor?.username}` : `Delete Messages from ${modMenuAnchor?.username}`}
                            </DialogTitle>
                            <DialogContent>
                                <Typography variant="body2" sx={{ color: themeVar("textSecondary"), mb: 3 }}>
                                    {modActionType === "timeout"
                                        ? `Are you sure you want to timeout this user for ${timeoutHours} hour(s)? They will be unable to send messages during this time.`
                                        : modActionType === "ban"
                                            ? `Are you sure you want to ban this user? They will be removed from the space and unable to rejoin.`
                                            : `Bulk delete recent messages from this user without a ban or timeout.`}
                                </Typography>

                                <Box sx={{ mt: 2 }}>
                                    <FormControl component="fieldset">
                                        <FormLabel component="legend" sx={{ color: themeVar("textLight"), fontWeight: 700, fontSize: '0.875rem', mb: 1 }}>CLEAN UP MESSAGES</FormLabel>
                                        <RadioGroup value={deleteCount} onChange={(e) => setDeleteCount(e.target.value === "all" || e.target.value === "this" ? e.target.value : parseInt(e.target.value))}>
                                            <FormControlLabel value={0} control={<Radio size="small" sx={{ color: themeVar("textSecondary"), '&.Mui-checked': { color: themeVar("primary") } }} />} label={<Typography variant="body2">Don't delete any</Typography>} />
                                            <FormControlLabel value="this" control={<Radio size="small" sx={{ color: themeVar("textSecondary"), '&.Mui-checked': { color: themeVar("primary") } }} />} label={<Typography variant="body2">Just this message</Typography>} />
                                            <FormControlLabel value={5} control={<Radio size="small" sx={{ color: themeVar("textSecondary"), '&.Mui-checked': { color: themeVar("primary") } }} />} label={<Typography variant="body2">Last 5 messages</Typography>} />
                                            <FormControlLabel value={10} control={<Radio size="small" sx={{ color: themeVar("textSecondary"), '&.Mui-checked': { color: themeVar("primary") } }} />} label={<Typography variant="body2">Last 10 messages</Typography>} />
                                            <FormControlLabel value={50} control={<Radio size="small" sx={{ color: themeVar("textSecondary"), '&.Mui-checked': { color: themeVar("primary") } }} />} label={<Typography variant="body2">Last 50 messages</Typography>} />
                                            <FormControlLabel value={100} control={<Radio size="small" sx={{ color: themeVar("textSecondary"), '&.Mui-checked': { color: themeVar("primary") } }} />} label={<Typography variant="body2">Last 100 messages</Typography>} />
                                            <FormControlLabel value="all" control={<Radio size="small" sx={{ color: themeVar("textSecondary"), '&.Mui-checked': { color: themeVar("primary") } }} />} label={<Typography variant="body2">All messages</Typography>} />
                                        </RadioGroup>
                                    </FormControl>

                                    <Box sx={{ mt: 3 }}>
                                        <FormControl component="fieldset">
                                            <FormLabel component="legend" sx={{ color: themeVar("textLight"), fontWeight: 700, fontSize: '0.875rem', mb: 1 }}>DELETION SCOPE</FormLabel>
                                            <RadioGroup row value={deleteScope} onChange={(e) => setDeleteScope(e.target.value as any)}>
                                                <FormControlLabel value="channel" control={<Radio size="small" sx={{ color: themeVar("textSecondary"), '&.Mui-checked': { color: themeVar("primary") } }} />} label={<Typography variant="body2">This Channel</Typography>} />
                                                <FormControlLabel value="space" control={<Radio size="small" sx={{ color: themeVar("textSecondary"), '&.Mui-checked': { color: themeVar("primary") } }} />} label={<Typography variant="body2">Whole Space</Typography>} />
                                            </RadioGroup>
                                        </FormControl>
                                    </Box>
                                </Box>
                            </DialogContent>
                            <DialogActions sx={{ p: 3, pt: 1 }}>
                                <Button onClick={() => setModDialogOpen(false)} disabled={isProcessingMod} sx={{ color: themeVar("textSecondary"), fontWeight: 700 }}>Cancel</Button>
                                <Button
                                    onClick={handleModActionConfirm}
                                    disabled={isProcessingMod}
                                    variant="contained"
                                    color={modActionType === "ban" ? "error" : "primary"}
                                    sx={{ fontWeight: 800, px: 3, textTransform: 'none', borderRadius: 2 }}
                                >
                                    {isProcessingMod ? "Processing..." : modActionType === "timeout" ? "Confirm Timeout" : modActionType === "ban" ? "Confirm Ban" : "Confirm Deletion"}
                                </Button>
                            </DialogActions>
                        </Dialog>

                        {modMenuAnchor && (
                            <MemberNotesDialog
                                open={notesDialogOpen}
                                onClose={() => { setNotesDialogOpen(false); setModMenuAnchor(null); }}
                                spaceId={channel.spaceId}
                                userId={modMenuAnchor.userId}
                                username={modMenuAnchor.username}
                                avatarUrl={modMenuAnchor.avatarUrl}
                                myRole={userRole || "member"}
                            />
                        )}

                        <div ref={bottomRef} />

                        {/* External Link Safety Dialog */}
                        <Dialog
                            open={Boolean(externalLink)}
                            onClose={() => setExternalLink(null)}
                            PaperProps={{
                                sx: {
                                    bgcolor: themeVar("backgroundAlt"),
                                    color: themeVar("textLight"),
                                    backgroundImage: "none",
                                    border: `1px solid ${themeVar("border")}`,
                                    borderRadius: 4,
                                    minWidth: 400
                                }
                            }}
                        >
                            <DialogTitle sx={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 1.5, color: themeVar("warning") }}>
                                <AlertTriangle size={24} /> Security Warning
                            </DialogTitle>
                            <DialogContent>
                                <Typography variant="body1" sx={{ color: themeVar("textLight"), mb: 2, fontWeight: 700 }}>
                                    You are leaving the application.
                                </Typography>
                                <Typography variant="body2" sx={{ color: themeVar("textSecondary"), mb: 3 }}>
                                    This link is taking you to an external website. Always verify the destination URL is safe before proceeding.
                                </Typography>

                                <Box sx={{
                                    p: 2,
                                    bgcolor: "rgba(0,0,0,0.2)",
                                    border: `1px solid ${themeVar("border")}`,
                                    borderRadius: 2,
                                    wordBreak: "break-all"
                                }}>
                                    <Typography variant="caption" sx={{ color: themeVar("textSecondary"), display: "block", mb: 0.5, fontWeight: 700, textTransform: "uppercase" }}>
                                        Destination URL
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeVar("primary"), fontFamily: "monospace" }}>
                                        {externalLink?.url}
                                    </Typography>
                                </Box>
                            </DialogContent>
                            <DialogActions sx={{ p: 3, pt: 1 }}>
                                <Button onClick={() => setExternalLink(null)} sx={{ color: themeVar("textSecondary"), fontWeight: 700 }}>
                                    Stay Here
                                </Button>
                                <Button
                                    component="a"
                                    href={externalLink?.url || ""}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setExternalLink(null)}
                                    variant="contained"
                                    sx={{ fontWeight: 800, px: 3, textTransform: "none", borderRadius: 2 }}
                                >
                                    Visit Site <ExternalLink size={16} style={{ marginLeft: 8 }} />
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </>
                )}
            </Box>

            {/* Composer */}
            {!isDocumentChannel && !isReadOnlyForMe && (
                <Box sx={{
                    p: 2,
                    pt: 0,
                    // The following styles were moved from the original instruction's snippet
                    // to ensure they are applied correctly to the parent Box.
                    // The instruction's snippet had some misplaced styles.
                }}>
                    <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        bgcolor: `color-mix(in oklab, ${themeVar("backgroundAlt")}, transparent 30%)`,
                        borderRadius: 3,
                        px: 2,
                        py: 1,
                        border: `1px solid ${themeVar("border")}`,
                        "&:focus-within": { borderColor: themeVar("primary") }
                    }}>
                        <TextField
                            fullWidth
                            multiline
                            maxRows={10}
                            placeholder={
                                isTimedOut
                                    ? "You are currently timed out and cannot send messages."
                                    : isReadOnlyForMe
                                        ? "You do not have permission to send messages in this channel."
                                        : `Message ${channel.name}`
                            }
                            value={input}
                            disabled={!me || isReadOnlyForMe}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            variant="standard"
                            InputProps={{
                                disableUnderline: true,
                                sx: { color: themeVar("textLight"), fontSize: "0.95rem" }
                            }}
                        />
                        <IconButton
                            size="small"
                            onClick={handleSend}
                            disabled={!canSend}
                            sx={{
                                color: canSend ? themeVar("primary") : themeVar("textSecondary"),
                                transition: "all 0.2s"
                            }}
                        >
                            <Send size={20} />
                        </IconButton>
                    </Box>
                    <Typography variant="caption" sx={{ color: themeVar("textSecondary"), px: 2, mt: 1, display: "block", fontSize: 10, opacity: 0.5 }}>
                        Press Enter to send. Use Shift+Enter for new lines.
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

function EmojiPickerPopover({
    anchorEl,
    onClose,
    onSelect,
    customEmojis
}: {
    anchorEl: HTMLElement | null,
    onClose: () => void,
    onSelect: (emoji: string) => void,
    customEmojis: any[] | undefined
}) {
    const [tabValue, setTabValue] = useState(0);

    return (
        <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            PaperProps={{
                sx: {
                    bgcolor: themeVar("backgroundAlt"),
                    border: `1px solid ${themeVar("border")}`,
                    borderRadius: 4,
                    width: 320,
                    maxHeight: 400,
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
                    overflow: "hidden"
                }
            }}
        >
            <Box sx={{ borderBottom: `1px solid ${themeVar("border")}`, bgcolor: "rgba(0,0,0,0.2)" }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, v) => setTabValue(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        minHeight: 40,
                        "& .MuiTab-root": {
                            minHeight: 40,
                            minWidth: 44,
                            fontSize: "1.2rem",
                            p: 0,
                            color: themeVar("textSecondary"),
                            "&.Mui-selected": { color: themeVar("primary"), bgcolor: "rgba(255,255,255,0.05)" }
                        },
                        "& .MuiTabs-indicator": { height: 2, bgcolor: themeVar("primary") }
                    }}
                >
                    {EMOJI_CATEGORIES.map((cat) => (
                        <Tab key={cat.name} label={cat.icon} title={cat.name} />
                    ))}
                    {customEmojis && customEmojis.length > 0 && (
                        <Tab key="custom" label="💎" title="Custom Emojis" />
                    )}
                </Tabs>
            </Box>

            <Box sx={{ p: 1.5, overflowY: "auto", flex: 1, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 0.5 }}>
                {tabValue < EMOJI_CATEGORIES.length ? (
                    EMOJI_CATEGORIES[tabValue].emojis.map(emoji => (
                        <IconButton
                            key={emoji}
                            onClick={() => onSelect(emoji)}
                            sx={{
                                fontSize: "1.4rem",
                                p: 0.5,
                                borderRadius: 2,
                                "&:hover": { bgcolor: "rgba(255,255,255,0.1)", transform: "scale(1.15)" },
                                transition: "all 0.1s"
                            }}
                        >
                            {emoji}
                        </IconButton>
                    ))
                ) : (
                    customEmojis?.map(emoji => (
                        <IconButton
                            key={emoji._id}
                            onClick={() => onSelect(emoji.url || emoji.storageId)}
                            sx={{
                                p: 0.5,
                                borderRadius: 2,
                                "&:hover": { bgcolor: "rgba(255,255,255,0.1)", transform: "scale(1.15)" },
                                transition: "all 0.1s"
                            }}
                        >
                            <img src={emoji.url || ""} alt={emoji.name} style={{ width: 24, height: 24, objectFit: "contain" }} />
                        </IconButton>
                    ))
                )}
            </Box>

            <Box sx={{ p: 1, bgcolor: "rgba(0,0,0,0.1)", borderTop: `1px solid ${themeVar("border")}`, textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: themeVar("textSecondary"), fontWeight: 700 }}>
                    {tabValue < EMOJI_CATEGORIES.length ? EMOJI_CATEGORIES[tabValue].name : "Custom Emojis"}
                </Typography>
            </Box>
        </Popover>
    );
}

function MarkdownText({ content, onLinkClick }: { content: string, onLinkClick?: (url: string, text: string) => void }) {
    // Very simple markdown parser for bold, italic, and links
    const parts = content.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g);

    return (
        <Typography variant="body2" sx={{ color: themeVar("textLight"), whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.5 }}>
            {parts.map((part, i) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                    return <Box component="span" key={i} sx={{ fontWeight: 800 }}>{part.slice(2, -2)}</Box>;
                }
                if (part.startsWith("*") && part.endsWith("*")) {
                    return <Box component="span" key={i} sx={{ fontStyle: "italic" }}>{part.slice(1, -1)}</Box>;
                }
                if (part.startsWith("[") && part.includes("](")) {
                    const match = part.match(/\[(.*?)\]\((.*?)\)/);
                    if (match) {
                        const text = match[1];
                        const url = match[2];

                        // Sanitize URL protocol
                        const isSafe = url.startsWith("http://") || url.startsWith("https://");
                        if (!isSafe) {
                            return <Box component="span" key={i} sx={{ color: themeVar("textSecondary"), textDecoration: "line-through" }} title="Unsafe Link Blocked">{text}</Box>;
                        }

                        return (
                            <Box
                                component="span"
                                key={i}
                                onClick={(e: any) => {
                                    if (onLinkClick) {
                                        e.preventDefault();
                                        onLinkClick(url, text);
                                    }
                                }}
                                sx={{
                                    color: themeVar("primary"),
                                    textDecoration: "none",
                                    cursor: "pointer",
                                    "&:hover": { textDecoration: "underline" }
                                }}
                            >
                                {text}
                            </Box>
                        );
                    }
                }
                return part;
            })}
        </Typography>
    );
}

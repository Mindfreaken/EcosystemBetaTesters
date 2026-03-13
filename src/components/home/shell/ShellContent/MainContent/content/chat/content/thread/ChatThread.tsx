"use client";

import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import { Send, Flag, ShieldAlert, Smile, X } from "lucide-react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import EmotePicker from "./EmotePicker";
import { themeVar } from "@/theme/registry";
import { useToast } from "@/hooks/use-toast";

export type MinimalChat = { _id: string; name: string };

export default function ChatThread({
  chat,
}: {
  chat: MinimalChat;
}) {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const hasInitScrollRef = useRef(false);
  const prependLoadRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  const markedReadRef = useRef<Set<string>>(new Set());

  // Report Dialog State
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  // Current user
  const me = useQuery(api.users.onboarding.queries.me, {});

  // Messages for selected chat (paginated)
  const messages = usePaginatedQuery(
    api.chat.functions.messages.getMessagesWithReactions,
    chat ? { chatId: chat._id as any } : ("skip" as any),
    { initialNumItems: 25 }
  );

  // Custom user emotes
  const customEmojis = useQuery(api.spaces.emojis.getUserAllCustomEmojis);
  const emojiMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of customEmojis || []) {
      map.set(e.name, e.url);
    }
    return map;
  }, [customEmojis]);

  const [emotePickerAnchor, setEmotePickerAnchor] = useState<HTMLElement | null>(null);
  const [reactionTargetId, setReactionTargetId] = useState<string | null>(null);

  const orderedMessages = useMemo(() => {
    if (!messages || !chat) return [] as typeof messages.results;
    // API returns newest-first; display oldest-first
    return [...messages.results].reverse();
  }, [messages, chat]);

  // Mark messages as read for the current user when viewing the thread
  const markMessageRead = useMutation(api.chat.functions.messages.markMessageRead);
  useEffect(() => {
    if (!me?._id) return;
    if (!orderedMessages.length) return;
    const myId = (me._id as any).toString();
    const candidates = orderedMessages.filter((m) => {
      const sender = m.senderId ? (m.senderId as any).toString() : null;
      return sender !== myId; // includes messages with no sender (system)
    });
    const toMark = candidates.filter((m) => !markedReadRef.current.has((m._id as any).toString()));
    if (!toMark.length) return;
    Promise.all(
      toMark.map(async (m) => {
        try {
          await markMessageRead({ messageId: m._id as any, userId: me._id as any, deviceInfo: "chat-thread" });
          markedReadRef.current.add((m._id as any).toString());
        } catch { }
      })
    ).catch(() => { });
  }, [orderedMessages.length, me?._id]);

  // Auto-scroll logic:
  // - On first render with messages, jump to bottom immediately (no animation)
  // - On subsequent updates, only auto-scroll if user is near the bottom (smooth)
  useLayoutEffect(() => {
    if (!listRef.current || !bottomRef.current) return;
    const el = listRef.current;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const NEAR_BOTTOM_PX = 120;

    if (prependLoadRef.current) {
      const prevH = prevScrollHeightRef.current;
      const newH = el.scrollHeight;
      const delta = newH - prevH;
      el.scrollTop = el.scrollTop + delta;
      prependLoadRef.current = false;
      return;
    }

    if (!hasInitScrollRef.current) {
      hasInitScrollRef.current = true;
      bottomRef.current.scrollIntoView({ behavior: "auto", block: "end" });
      return;
    }

    if (distanceFromBottom <= NEAR_BOTTOM_PX) {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    }
  }, [orderedMessages.length]);

  // Reset init scroll when switching chats so each new chat opens at the bottom instantly
  useEffect(() => {
    hasInitScrollRef.current = false;
    markedReadRef.current.clear();
  }, [chat?._id]);

  // Treat chats named "System" as read-only/system (hide composer)
  const isSystemChat = useMemo(() => {
    const n = chat?.name?.trim() || "";
    return n.length > 0 && /^system($|\s)/i.test(n);
  }, [chat]);

  // Fetch sender details for messages to show names
  const senderIds = useMemo(() => {
    const ids: any[] = [];
    for (const m of messages?.results || []) if (m.senderId) ids.push(m.senderId as any);
    const seen = new Set<string>();
    const uniq: any[] = [];
    for (const id of ids) {
      const key = id.toString();
      if (!seen.has(key)) {
        seen.add(key);
        uniq.push(id);
      }
    }
    return uniq;
  }, [messages?.results]);

  const senders = useQuery(
    api.users.onboarding.queries.getUsersDetailsByConvexId,
    senderIds.length ? ({ userIds: senderIds as any } as any) : ("skip" as any)
  );

  const senderMap = useMemo(() => {
    const map = new Map<string, { displayName: string; username: string; avatarUrl?: string; clerkUserId?: string }>();
    for (const s of senders || []) map.set(s.userId.toString(), { displayName: s.displayName, username: s.username, avatarUrl: s.avatarUrl, clerkUserId: s.clerkUserId });
    return map;
  }, [senders]);

  const sendMessage = useMutation(api.chat.functions.messages.sendMessage);
  const toggleReaction = useMutation(api.chat.functions.messages.toggleReaction);
  const reportMessage = useMutation(api.hub.overseer.reportMessage);
  const canSend = !!chat && !isSystemChat && !!me && input.trim().length > 0;

  const handleSend = async () => {
    if (!canSend || !chat || !me) return;
    const content = input.trim();
    try {
      await sendMessage({
        chatId: chat._id as any,
        content,
        senderId: me._id,
      });
      setInput("");
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  const handleReport = (messageId: string) => {
    setReportMessageId(messageId);
    setReportReason("");
  };

  const submitReport = async () => {
    if (!reportMessageId || !reportReason.trim()) return;
    setIsReporting(true);
    try {
      await reportMessage({ messageId: reportMessageId as any, reason: reportReason.trim() });
      setReportMessageId(null);
      setReportReason("");
      toast({
        title: "Report Submitted",
        description: "Thank you for your feedback.",
      });
    } catch (e) {
      console.error("Failed to report message", e);
      toast({
        title: "Report Failed",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReporting(false);
    }
  };

  const handleEmoteSelect = (name: string, isCustom: boolean) => {
    if (reactionTargetId) {
      toggleReaction({ messageId: reactionTargetId as any, userId: me!._id, reaction: name });
      setReactionTargetId(null);
      setEmotePickerAnchor(null);
    } else {
      const textToInsert = isCustom ? `:${name}: ` : `${name} `;
      setInput(prev => prev + textToInsert);
    }
  };

  const isOnlyEmotes = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return false;
    // Regex to match custom emotes :name: and standard emojis
    const customEmoteRegex = /:[a-zA-Z0-9_]+:/g;
    const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
    const remaining = trimmed.replace(customEmoteRegex, "").replace(emojiRegex, "").replace(/\s+/g, "");
    return remaining.length === 0;
  };

  const renderContent = (content: string) => {
    const isJumbo = isOnlyEmotes(content);
    const size = isJumbo ? 48 : 22;
    const emojiSize = isJumbo ? "2.5rem" : "inherit";

    const parts = content.split(/(:[a-zA-Z0-9_]+:)/g);
    return (
      <Box component="span" sx={{ fontSize: emojiSize, display: "inline-block", verticalAlign: "middle" }}>
        {parts.map((part, i) => {
          if (part.startsWith(":") && part.endsWith(":")) {
            const name = part.slice(1, -1);
            const url = emojiMap.get(name);
            if (url) {
              return (
                <Tooltip key={i} title={part}>
                  <Box
                    component="img"
                    src={url}
                    sx={{
                      width: size,
                      height: size,
                      verticalAlign: "middle",
                      display: "inline-block",
                      mx: 0.25,
                      transition: "transform 0.2s"
                    }}
                  />
                </Tooltip>
              );
            }
          }
          return <span key={i}>{part}</span>;
        })}
      </Box>
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Messages area */}
      <Box
        ref={listRef}
        sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 1 }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const NEAR_TOP_PX = 120;
          if (el.scrollTop <= NEAR_TOP_PX && messages && messages.status !== "LoadingMore" && messages.status !== "Exhausted") {
            prependLoadRef.current = true;
            prevScrollHeightRef.current = el.scrollHeight;
            messages.loadMore(25);
          }
        }}
      >
        {messages.status === "LoadingMore" && messages.results.length === 0 ? (
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Loading messages…
          </Typography>
        ) : orderedMessages.length === 0 ? (
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            No messages yet. Start the conversation!
          </Typography>
        ) : (
          <>
            {orderedMessages.map((m) => {
              const isMine = !!me && m.senderId && m.senderId.toString() === (me._id as any).toString();
              const senderUser = m.senderId ? senderMap.get(m.senderId.toString()) : undefined;
              const senderLabel = !isMine
                ? (senderUser?.displayName || senderUser?.username) || "Unknown"
                : undefined;
              const avatarUrl = senderUser?.avatarUrl;
              const isSystemUser = senderUser?.clerkUserId === "system-user-0000-0000-0000-000000000000";
              const timeLabel = new Date(m._creationTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
              return (
                <Box key={m._id} sx={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                  <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, flexDirection: isMine ? "row-reverse" : "row", maxWidth: "85%" }}>
                    {/* Avatar */}
                    {m.senderId && (
                      <Avatar sx={{ width: 28, height: 28 }} src={avatarUrl}>
                        {!avatarUrl && senderLabel ? senderLabel[0]?.toUpperCase() : undefined}
                      </Avatar>
                    )}
                    {/* Bubble */}
                    <Box
                      sx={{
                        border: isMine
                          ? `1px solid color-mix(in oklab, ${themeVar("secondary")}, transparent 40%)`
                          : `1px solid ${themeVar("border")}`,
                        backgroundColor: isMine
                          ? `color-mix(in oklab, ${themeVar("secondary")} 12%, ${themeVar("background")} 88%)`
                          : themeVar("card"),
                        boxShadow: `0 2px 8px color-mix(in oklab, ${themeVar("foreground")}, transparent 95%)`,
                        borderRadius: isMine ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                        px: 1.25,
                        py: 0.75,
                        maxWidth: "100%",
                        minWidth: 120,
                        minHeight: 36,
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        position: "relative",
                        "&:hover .report-button, &:hover .react-button": { opacity: 1 },
                      }}
                    >
                      {/* For others: header with name + time */}
                      {m.senderId && (
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), display: "flex", gap: 0.75, alignItems: "center", justifyContent: "flex-start", fontVariantNumeric: "tabular-nums", letterSpacing: ".02em" }}>
                            {!isMine && <span>{senderLabel}</span>}
                            {!isMine && <span style={{ opacity: 0.8 }}>•</span>}
                            <span>{timeLabel}</span>
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ ml: 1.5, alignItems: "center" }}>
                            <IconButton
                              className="react-button"
                              size="small"
                              onClick={(e) => {
                                setEmotePickerAnchor(e.currentTarget);
                                setReactionTargetId(m._id);
                              }}
                              sx={{
                                opacity: 0,
                                transition: "opacity 0.2s",
                                p: 0.5,
                                color: themeVar("mutedForeground"),
                                "&:hover": { color: themeVar("primary"), bgcolor: "rgba(255,255,255,0.05)" },
                              }}
                              title="React to message"
                            >
                              <Smile size={14} />
                            </IconButton>
                            {!isMine && !isSystemUser && (
                              <IconButton
                                className="report-button"
                                size="small"
                                onClick={() => handleReport(m._id)}
                                sx={{
                                  opacity: 0,
                                  transition: "opacity 0.2s",
                                  p: 0.5,
                                  color: themeVar("mutedForeground"),
                                  "&:hover": { color: themeVar("destructive"), bgcolor: `color-mix(in oklab, ${themeVar("destructive")}, transparent 90%)` },
                                }}
                                title="Report message"
                              >
                                <Flag size={14} />
                              </IconButton>
                            )}
                          </Stack>
                        </Box>
                      )}

                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "anywhere", color: themeVar("foreground") }}>
                        {renderContent(m.content)}
                      </Typography>

                      {/* Reactions display */}
                      {(m as any).reactions && (m as any).reactions.length > 0 && (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                          {Object.entries(
                            (m as any).reactions.reduce((acc: any, r: any) => {
                              acc[r.reaction] = (acc[r.reaction] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([reaction, count]) => {
                            const isMyReaction = (m as any).reactions.some((r: any) => r.reaction === reaction && r.userId === me?._id);
                            const url = emojiMap.get(reaction);
                            return (
                              <Box
                                key={reaction}
                                onClick={() => toggleReaction({ messageId: m._id as any, userId: me!._id, reaction })}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  px: 0.75,
                                  py: 0.25,
                                  borderRadius: 1.5,
                                  bgcolor: isMyReaction ? `color-mix(in oklab, ${themeVar("primary")} 20%, transparent)` : "rgba(0,0,0,0.1)",
                                  border: `1px solid ${isMyReaction ? themeVar("primary") : themeVar("border")}`,
                                  cursor: "pointer",
                                  "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }
                                }}
                              >
                                {url ? (
                                  <Box component="img" src={url} sx={{ width: 14, height: 14 }} />
                                ) : (
                                  <Typography variant="caption">{reaction}</Typography>
                                )}
                                <Typography variant="caption" sx={{ fontWeight: 800 }}>{count as number}</Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
            {/* bottom sentinel for auto-scroll */}
            <div ref={bottomRef} />
          </>
        )}
      </Box>

      {/* Composer (hidden for system chats) */}
      {!isSystemChat && (
        <Box sx={{ borderTop: `1px solid ${themeVar("border")}`, backgroundColor: themeVar("card"), p: 1 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
            <TextField
              size="small"
              placeholder={me ? "Type a message" : "Select a chat to start typing"}
              value={input}
              disabled={!me}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              inputProps={{ maxLength: 4000 }}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: themeVar("input"),
                  '& fieldset': { borderColor: themeVar("border") },
                  '&:hover fieldset': { borderColor: `color-mix(in oklab, ${themeVar("primary")}, transparent 40%)` },
                  '&.Mui-focused fieldset': {
                    borderColor: themeVar("primary"),
                    boxShadow: `0 0 0 2px color-mix(in oklab, ${themeVar("primary")}, transparent 70%)`,
                  },
                  '& .MuiInputBase-input': { color: themeVar("foreground") },
                  '& .MuiInputBase-input::placeholder': { color: themeVar("mutedForeground") },
                },
              }}
            />
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <IconButton
                size="small"
                onClick={(e) => {
                  setReactionTargetId(null);
                  setEmotePickerAnchor(e.currentTarget);
                }}
                disabled={!me}
                sx={{ color: themeVar("mutedForeground"), "&:hover": { color: themeVar("primary") } }}
              >
                <Smile size={16} />
              </IconButton>
              <IconButton size="small" onClick={handleSend} disabled={!canSend} sx={{ color: canSend ? themeVar("secondary") : themeVar("mutedForeground") }}>
                <Send size={16} />
              </IconButton>
            </Stack>
          </Box>
        </Box>
      )}

      <EmotePicker
        open={Boolean(emotePickerAnchor)}
        anchorEl={emotePickerAnchor}
        onClose={() => setEmotePickerAnchor(null)}
        onSelect={handleEmoteSelect}
      />

      {/* Report Dialog */}
      <Dialog
        open={Boolean(reportMessageId)}
        onClose={() => !isReporting && setReportMessageId(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: `color-mix(in oklab, ${themeVar("background")}, transparent 20%)`,
              backdropFilter: 'blur(4px)',
            },
          },
          paper: {
            sx: {
              background: `color-mix(in oklab, ${themeVar("card")}, transparent 5%)`,
              border: `1px solid color-mix(in oklab, ${themeVar("border")}, transparent 35%)`,
              boxShadow: `0 6px 18px color-mix(in oklab, ${themeVar("foreground")}, transparent 95%)`,
              borderRadius: '9px',
              overflow: 'hidden',
            },
          },
        }}
      >
        <DialogTitle sx={{ 
          px: 1.8, 
          py: 1.2, 
          color: themeVar("foreground"), 
          fontWeight: 700, 
          letterSpacing: 0.2, 
          fontSize: 17, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between" 
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <ShieldAlert size={20} color={themeVar("destructive")} />
            Report Message
          </Box>
          <IconButton
            size="small"
            onClick={() => setReportMessageId(null)}
            sx={{ color: themeVar("mutedForeground"), ml: 1, '&:hover': { color: themeVar("foreground"), backgroundColor: 'transparent' } }}
          >
            <X size={16} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0.5, pb: 0.8, px: 1.8, overflow: 'hidden' }}>
          <Typography variant="body2" sx={{ color: themeVar("mutedForeground"), mb: 2 }}>
            Help us understand what's wrong with this message. Your report will be reviewed by the Ecosystem Overseers.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            placeholder="Describe the issue (e.g., harassment, spam, inappropriate content)..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            disabled={isReporting}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: themeVar("input"),
                "& fieldset": { borderColor: themeVar("border") },
                "&:hover fieldset": { borderColor: themeVar("primary") },
                "&.Mui-focused fieldset": { borderColor: themeVar("primary") },
                color: themeVar("foreground"),
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 1.8, py: 1.2, gap: 1 }}>
          <Button
            onClick={() => setReportMessageId(null)}
            disabled={isReporting}
            sx={{
              color: themeVar("mutedForeground"),
              fontSize: 13,
              px: 1.25,
              minWidth: 0,
              '&:hover': { backgroundColor: `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)`, color: themeVar("primary") },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={submitReport}
            disabled={!reportReason.trim() || isReporting}
            variant="contained"
            sx={{
              backgroundColor: themeVar("destructive"),
              color: "white",
              px: 1.25,
              py: 0.4,
              fontSize: 13,
              boxShadow: `0 3px 8px color-mix(in oklab, ${themeVar("destructive")}, transparent 60%)`,
              "&:hover": { backgroundColor: `color-mix(in oklab, ${themeVar("destructive")}, transparent 10%)` },
              textTransform: "none",
              borderRadius: "8px",
              fontWeight: 600,
            }}
          >
            {isReporting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}



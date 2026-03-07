"use client";

import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import { Send, Flag, ShieldAlert } from "lucide-react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

export type MinimalChat = { _id: string; name: string };

export default function ChatThread({
  chat,
}: {
  chat: MinimalChat;
}) {
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
    api.chat.functions.messages.getMessagesForChat,
    chat ? { chatId: chat._id as any } : ("skip" as any),
    { initialNumItems: 25 }
  );

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
    const map = new Map<string, { displayName: string; username: string; avatarUrl?: string }>();
    for (const s of senders || []) map.set(s.userId.toString(), { displayName: s.displayName, username: s.username, avatarUrl: s.avatarUrl });
    return map;
  }, [senders]);

  const sendMessage = useMutation(api.chat.functions.messages.sendMessage);
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
      alert("Report submitted. Thank you for your feedback.");
    } catch (e) {
      console.error("Failed to report message", e);
      alert("Failed to submit report. Please try again.");
    } finally {
      setIsReporting(false);
    }
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
              const senderLabel = !isMine
                ? (m.senderId && (senderMap.get(m.senderId.toString())?.displayName || senderMap.get(m.senderId.toString())?.username)) || "Unknown"
                : undefined;
              const avatarUrl = m.senderId ? senderMap.get(m.senderId.toString())?.avatarUrl : undefined;
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
                          ? "1px solid color-mix(in oklab, var(--secondary), transparent 60%)"
                          : "1px solid color-mix(in oklab, var(--foreground), transparent 88%)",
                        backgroundColor: isMine
                          ? "color-mix(in oklab, var(--secondary) 12%, var(--background) 88%)"
                          : "color-mix(in oklab, var(--background) 94%, var(--card) 6%)",
                        boxShadow: "0 2px 8px color-mix(in oklab, var(--foreground) 10%, transparent)",
                        borderRadius: isMine ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                        px: 1.25,
                        py: 0.75,
                        maxWidth: "100%",
                        minWidth: 120,
                        minHeight: 36,
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        position: "relative",
                        "&:hover .report-button": { opacity: 1 },
                      }}
                    >
                      {/* For others: header with name + time */}
                      {!isMine && m.senderId && (
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="caption" sx={{ color: "var(--textSecondary)", display: "flex", gap: 0.75, alignItems: "center", justifyContent: "flex-start", fontVariantNumeric: "tabular-nums", letterSpacing: ".02em" }}>
                            <span>{senderLabel}</span>
                            <span style={{ opacity: 0.8 }}>•</span>
                            <span>{timeLabel}</span>
                          </Typography>
                          {!isMine && (
                            <IconButton
                              className="report-button"
                              size="small"
                              onClick={() => handleReport(m._id)}
                              sx={{
                                opacity: 0,
                                transition: "opacity 0.2s",
                                p: 0.25,
                                color: "color-mix(in oklab, var(--foreground), transparent 60%)",
                                "&:hover": { color: "var(--error, #ff4444)" },
                              }}
                              title="Report message"
                            >
                              <Flag size={12} />
                            </IconButton>
                          )}
                        </Box>
                      )}

                      {/* No report button for own messages */}

                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "anywhere", color: "var(--text)" }}>
                        {m.content}
                      </Typography>
                      {/* For mine: footer timestamp right-aligned */}
                      {isMine && (
                        <Typography variant="caption" sx={{ color: "var(--textSecondary)", display: "flex", justifyContent: "flex-end", mt: 0.25, fontVariantNumeric: "tabular-nums", letterSpacing: ".02em" }}>
                          {timeLabel}
                        </Typography>
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
        <Box sx={{ borderTop: "1px solid var(--card-border)", backgroundColor: "var(--card)", p: 1 }}>
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
                  backgroundColor: 'var(--input)',
                  '& fieldset': { borderColor: 'var(--input-border)' },
                  '&:hover fieldset': { borderColor: 'color-mix(in oklab, var(--primary), transparent 40%)' },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--primary)',
                    boxShadow: '0 0 0 2px color-mix(in oklab, var(--primary), transparent 70%)',
                  },
                  '& .MuiInputBase-input': { color: 'var(--text)' },
                  '& .MuiInputBase-input::placeholder': { color: 'var(--text)' },
                },
              }}
            />
            <IconButton size="small" onClick={handleSend} disabled={!canSend} sx={{ color: canSend ? "var(--secondary)" : "color-mix(in oklab, var(--foreground), transparent 70%)" }}>
              <Send size={16} />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Report Dialog */}
      <Dialog
        open={Boolean(reportMessageId)}
        onClose={() => !isReporting && setReportMessageId(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "var(--background)",
            backgroundImage: "none",
            border: "1px solid var(--card-border)",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "var(--text)" }}>
          <ShieldAlert size={24} color="#ff4444" />
          Report Message
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "var(--textSecondary)", mb: 2 }}>
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
                backgroundColor: "var(--input)",
                "& fieldset": { borderColor: "var(--input-border)" },
                "&:hover fieldset": { borderColor: "var(--primary)" },
                "&.Mui-focused fieldset": { borderColor: "var(--primary)" },
                color: "var(--text)",
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => setReportMessageId(null)}
            disabled={isReporting}
            sx={{ color: "var(--textSecondary)" }}
          >
            Cancel
          </Button>
          <Button
            onClick={submitReport}
            disabled={!reportReason.trim() || isReporting}
            variant="contained"
            sx={{
              backgroundColor: "#ff4444",
              "&:hover": { backgroundColor: "#cc0000" },
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

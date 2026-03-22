"use client";

import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import { Send, Smile, X, Image as ImageIcon } from "lucide-react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import EmotePicker from "./EmotePicker";
import { themeVar } from "@/theme/registry";
import { useToast } from "@/hooks/use-toast";
import { signalManager } from "@/lib/crypto/signal";
import { useConvexStorage } from "@/services/convexStorage";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { encryptAndUploadFile } = useConvexStorage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [reactionsModalMessageId, setReactionsModalMessageId] = useState<string | null>(null);


  // Current user
  const me = useQuery(api.users.onboarding.queries.me, {});

  // Fetch chat details for participants (needed for encryption)
  const chatDetails = useQuery(
    api.chat.functions.chats.getChatDetails as any,
    chat?._id ? ({ chatId: chat._id } as any) : ("skip" as any)
  ) as any;

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
  const registerDevice = useMutation(api.chat.functions.keys.registerDevice);
  const userDevicesAndKeys = useQuery(api.chat.functions.keys.getUserDevicesAndKeys, 
    chatDetails?.participants ? { userIds: chatDetails.participants } : "skip"
  );

  // Initialize and register device
  useEffect(() => {
    if (!me?._id || !me?.clerkUserId) return; // Ensure full auth synced
    const init = async () => {
        try {
            const bundle = await signalManager.initializeDevice((me._id as any).toString());
            await registerDevice({
                ...bundle,
                deviceName: navigator.userAgent.split(') ')[0] + ')', // Simple device name
            });
        } catch (e) {
            console.error("Failed to register device for encryption", e);
        }
    };
    init();
  }, [me?._id, me?.clerkUserId]);

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
  const canSend = !!chat && !isSystemChat && !!me && (input.trim().length > 0 || !!selectedFile);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleSend = async () => {
    if (!canSend || !chat || !me || !userDevicesAndKeys) return;
    setIsUploading(true);
    const content = input.trim();
    
    try {
      let attachments: any[] = [];
      let fileKeysMetadata: any[] = [];

      if (selectedFile) {
        // 1. Encrypt and upload the file
        const { fileId, downloadUrl, fileName, fileKey } = await encryptAndUploadFile(
          selectedFile,
          `chats/${chat._id}/messages`,
          me._id,
          chat._id as any
        );

        attachments = [{
          type: "file",
          fileName,
          fileUrl: downloadUrl,
          mimeType: selectedFile.type,
          size: selectedFile.size,
          fileId,
        }];

        // 2. Encrypt the file key for each device
        const fileKeyEncryption = await signalManager.encryptFileKey(fileKey, userDevicesAndKeys);
        fileKeysMetadata = fileKeyEncryption.ciphertexts;
      }

      // 3. Encrypt the text content
      const encryptionMetadata = await signalManager.encryptMessage(content || "[Attachment]", userDevicesAndKeys);
      
      // 4. Send the message with both text and file encryption metadata
      await sendMessage({
        chatId: chat._id as any,
        content: "[Encrypted Message]",
        senderId: me._id,
        encryptionMetadata: {
          ...encryptionMetadata,
          fileKeys: fileKeysMetadata.length > 0 ? fileKeysMetadata : undefined,
        } as any,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      setInput("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      console.error("Failed to send encrypted message", e);
      toast({
        title: "Sending Failed",
        description: "Could not encrypt or upload your message.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
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
    const customEmoteRegex = /:[a-zA-Z0-9_]+:/g;
    const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
    const remaining = trimmed.replace(customEmoteRegex, "").replace(emojiRegex, "").replace(/\s+/g, "");
    return remaining.length === 0;
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
                              aria-label="React to message"
                            >
                              <Smile size={14} />
                            </IconButton>
                          </Stack>
                        </Box>
                      )}

                      <Typography component="div" variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "anywhere", color: themeVar("foreground") }}>
                        <MessageContent 
                          m={m} 
                          meId={me?._id as any} 
                          emojiMap={emojiMap} 
                          isOnlyEmotes={isOnlyEmotes} 
                        />
                      </Typography>

                      {/* Reactions display */}
                      {(m as any).reactions && (m as any).reactions.length > 0 && (() => {
                        const grouped = (m as any).reactions.reduce((acc: any, r: any) => {
                          acc[r.reaction] = (acc[r.reaction] || 0) + 1;
                          return acc;
                        }, {});
                        const entries = Object.entries(grouped);
                        const REACTION_LIMIT = 10;
                        const displayed = entries.slice(0, REACTION_LIMIT);
                        const hasOverflow = entries.length > REACTION_LIMIT;

                        return (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                            {displayed.map(([reaction, count]) => {
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
                            {hasOverflow && (
                              <Box
                                onClick={() => setReactionsModalMessageId(m._id)}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 1.5,
                                  bgcolor: "rgba(0,0,0,0.1)",
                                  border: `1px solid ${themeVar("border")}`,
                                  cursor: "pointer",
                                  "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }
                                }}
                              >
                                <Typography variant="caption" sx={{ fontWeight: 800 }}>...</Typography>
                              </Box>
                            )}
                          </Box>
                        );
                      })()}
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
          {selectedFile && (
            <Box sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1, border: `1px solid ${themeVar("border")}` }}>
               <ImageIcon size={16} style={{ color: themeVar("primary") }} />
               <Typography variant="caption" noWrap sx={{ flex: 1 }}>{selectedFile.name}</Typography>
               <IconButton size="small" aria-label="Remove attachment" onClick={() => setSelectedFile(null)}><X size={14} /></IconButton>
            </Box>
          )}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={onFileSelect}
              accept="image/*"
            />
            <TextField
              size="small"
              placeholder={me ? (isUploading ? "Uploading..." : "Type a message") : "Select a chat to start typing"}
              value={input}
              disabled={!me || isUploading}
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
                  // ... rest stays same
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
                aria-label="Add emoji"
                onClick={(e) => {
                  setReactionTargetId(null);
                  setEmotePickerAnchor(e.currentTarget);
                }}
                disabled={!me || isUploading}
                sx={{ color: themeVar("mutedForeground"), "&:hover": { color: themeVar("primary") } }}
              >
                <Smile size={16} />
              </IconButton>
              <IconButton
                size="small"
                aria-label="Attach image"
                onClick={() => fileInputRef.current?.click()}
                disabled={!me || isUploading}
                sx={{ color: themeVar("mutedForeground"), "&:hover": { color: themeVar("primary") } }}
              >
                <ImageIcon size={16} />
              </IconButton>
              <IconButton size="small" aria-label="Send message" onClick={handleSend} disabled={!canSend || isUploading} sx={{ color: canSend ? themeVar("secondary") : themeVar("mutedForeground") }}>
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

      <ReactionsModal
        message={orderedMessages.find(m => m._id === reactionsModalMessageId)}
        open={Boolean(reactionsModalMessageId)}
        onClose={() => setReactionsModalMessageId(null)}
        senderMap={senderMap}
        emojiMap={emojiMap}
        onToggleReaction={(reaction) => {
          if (reactionsModalMessageId) {
            toggleReaction({ messageId: reactionsModalMessageId as any, userId: me!._id, reaction });
          }
        }}
        meId={me?._id as any}
      />

    </Box>
  );
}

function ReactionsModal({ 
  message, 
  open, 
  onClose, 
  senderMap, 
  emojiMap,
  onToggleReaction,
  meId
}: { 
  message: any; 
  open: boolean; 
  onClose: () => void;
  senderMap: Map<string, any>;
  emojiMap: Map<string, string>;
  onToggleReaction: (reaction: string) => void;
  meId: string;
}) {
  if (!message) return null;

  const grouped = (message.reactions || []).reduce((acc: any, r: any) => {
    if (!acc[r.reaction]) acc[r.reaction] = [];
    acc[r.reaction].push(r.userId);
    return acc;
  }, {});

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2, bgcolor: themeVar("card") } }}>
      <Box sx={{ p: 2, color: themeVar("foreground") }}>
        <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700 }}>Message Reactions</Typography>
        
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {Object.entries(grouped).map(([reaction, userIds]: [string, any]) => {
            const url = emojiMap.get(reaction);
            const isMyReaction = userIds.includes(meId);
            
            const tooltipTitle = userIds.map((uid: string) => {
                const u = senderMap.get(uid);
                return u?.displayName || u?.username || "Unknown";
            }).join(", ");

            return (
              <Tooltip key={reaction} title={tooltipTitle} arrow placement="top">
                <Box
                  onClick={() => onToggleReaction(reaction)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1.25,
                    py: 0.75,
                    borderRadius: 1.5,
                    cursor: "pointer",
                    bgcolor: isMyReaction ? `color-mix(in oklab, ${themeVar("primary")} 15%, transparent)` : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isMyReaction ? themeVar("primary") : themeVar("border")}`,
                    "&:hover": { bgcolor: "rgba(255,255,255,0.1)" }
                  }}
                >
                  {url ? <Box component="img" src={url} sx={{ width: 18, height: 18 }} /> : <Typography variant="body2">{reaction}</Typography>}
                  <Typography variant="body2" sx={{ fontWeight: 800, opacity: 0.9 }}>{userIds.length}</Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        <Box sx={{ mt: 2.5, display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={onClose} size="small" variant="contained" sx={{ bgcolor: themeVar("primary"), color: "white", px: 3 }}>
            Done
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}

function MessageContent({ m, meId, emojiMap, isOnlyEmotes }: { m: any; meId: string; emojiMap: Map<string, string>; isOnlyEmotes: (content: string) => boolean }) {
  const isEncrypted = !!m.encryptionMetadata;
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [decryptedImages, setDecryptedImages] = useState<Record<string, string>>({});
  const [isDecrypting, setIsDecrypting] = useState(isEncrypted);

  useEffect(() => {
    if (!isEncrypted || !meId) return;
    const decrypt = async () => {
      try {
        const myDeviceId = await signalManager.initializeDevice(meId);
        
        // 1. Decrypt text content
        const myCiphertext = m.encryptionMetadata.ciphertexts.find((c: any) => c.deviceId === myDeviceId.deviceId);
        if (myCiphertext) {
          const text = await signalManager.decryptMessage(
            m.senderId,
            m.encryptionMetadata.senderDeviceId,
            myCiphertext.ciphertext,
            myCiphertext.type
          );
          setDecryptedContent(text);
        } else {
          setDecryptedContent("[Message not encrypted for this device]");
        }

        // 2. Decrypt attachments if any
        if (m.attachments && m.attachments.length > 0 && m.encryptionMetadata.fileKeys) {
          const myFileKeyCiphertext = m.encryptionMetadata.fileKeys.find((c: any) => c.deviceId === myDeviceId.deviceId);
          if (myFileKeyCiphertext) {
            const fileKey = await signalManager.decryptFileKey(
              m.senderId,
              m.encryptionMetadata.senderDeviceId,
              myFileKeyCiphertext.ciphertext,
              myFileKeyCiphertext.type
            );

            const newDecryptedImages: Record<string, string> = {};
            for (const att of m.attachments) {
              if (att.mimeType?.startsWith("image/")) {
                try {
                  const resp = await fetch(att.fileUrl);
                  const blob = await resp.blob();
                  const arrayBuffer = await blob.arrayBuffer();
                  const data = new Uint8Array(arrayBuffer);
                  
                  // XOR Decrypt (prototype)
                  const resultData = new Uint8Array(data.length);
                  const keyBytes = new TextEncoder().encode(fileKey);
                  for (let i = 0; i < data.length; i++) {
                    resultData[i] = data[i] ^ keyBytes[i % keyBytes.length];
                  }
                  
                  const decryptedBlob = new Blob([resultData], { type: att.mimeType });
                  newDecryptedImages[att.fileId || att.fileUrl] = URL.createObjectURL(decryptedBlob);
                } catch (err) {
                  console.error("Failed to decrypt attachment", err);
                }
              }
            }
            setDecryptedImages(newDecryptedImages);
          }
        }
      } catch (e) {
        console.error("Decryption failed", e);
        setDecryptedContent("[Decryption Error]");
      } finally {
        setIsDecrypting(false);
      }
    };
    decrypt();

    return () => {
      // Cleanup blob URLs
      Object.values(decryptedImages).forEach(url => URL.revokeObjectURL(url));
    };
  }, [m._id, isEncrypted, meId]);

  const content = isEncrypted ? (decryptedContent || (isDecrypting ? "Decrypting..." : "[Encrypted]")) : m.content;
  const isJumbo = isOnlyEmotes(content);
  const size = isJumbo ? 48 : 22;
  const emojiSize = isJumbo ? "2.5rem" : "inherit";

  const parts = content.split(/(:[a-zA-Z0-9_]+:)/g);
  return (
    <Box>
      <Box component="span" sx={{ fontSize: emojiSize, display: "inline-block", verticalAlign: "middle" }}>
        {parts.map((part: string, i: number) => {
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

      {/* Attachments Display */}
      {m.attachments && m.attachments.length > 0 && (
        <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
          {m.attachments.map((att: any, i: number) => {
            const isImage = att.mimeType?.startsWith("image/");
            const displayUrl = isEncrypted ? decryptedImages[att.fileId || att.fileUrl] : att.fileUrl;

            if (isImage && displayUrl) {
              return (
                <Box
                  key={i}
                  component="img"
                  src={displayUrl}
                  sx={{
                    maxWidth: "100%",
                    maxHeight: 300,
                    borderRadius: 1,
                    cursor: "pointer",
                    "&:hover": { opacity: 0.9 }
                  }}
                  onClick={() => window.open(displayUrl, "_blank")}
                />
              );
            } else if (isImage && isEncrypted && !displayUrl) {
                return <Typography key={i} variant="caption">Decrypting Image...</Typography>;
            }

            return (
              <Button
                key={i}
                variant="outlined"
                size="small"
                startIcon={<ImageIcon size={14} />}
                onClick={() => window.open(att.fileUrl, "_blank")}
                sx={{ textTransform: "none" }}
              >
                {att.fileName}
              </Button>
            );
          })}
        </Box>
      )}
    </Box>
  );
}



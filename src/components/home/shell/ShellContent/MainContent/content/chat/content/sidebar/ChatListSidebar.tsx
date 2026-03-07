"use client";

import React, { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { Search, MessageSquarePlus, Home } from "lucide-react";
import SectionHeader from "../header/SectionHeader";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import Avatar from "@mui/material/Avatar";
import NewChatModal from "./componants/NewChatModal";
import Tooltip from "@mui/material/Tooltip";
import InputBase from "@mui/material/InputBase";

export type ChatListItem = {
  _id: string;
  name: string;
  isGroup: boolean;
  avatarUrl?: string;
  participants: string[];
  createdBy: string;
  lastActivityAt?: number;
  status?: "pending_first_message" | "active";
  _creationTime: number;
  admins?: string[];
  description?: string;
  unreadCount?: number;
};

 

export default function ChatListSidebar({
  collapsed = false,
  onSelect,
  onGoHome,
}: {
  collapsed?: boolean;
  onSelect?: (chat: Pick<ChatListItem, "_id" | "name">) => void;
  onGoHome?: () => void;
}) {
  // Get current Convex user, then their chats
  const me = useQuery(api.users.onboarding.queries.me, {});
  const chats = useQuery(
    api.chat.functions.chats.getUserChats,
    me?._id ? { userId: me._id } : "skip"
  ) as
    | Array<ChatListItem>
    | undefined;
  // Modal state for creating a new chat
  const [openNewChat, setOpenNewChat] = useState(false);
  const handleOpenNewChat = () => setOpenNewChat(true);
  const handleCloseNewChat = () => setOpenNewChat(false);

  // Sort chats by most recent activity, falling back to creation time
  const sortedChats = useMemo(() => {
    if (!chats) return [] as ChatListItem[];
    return [...chats].sort((a, b) => {
      const atA = a.lastActivityAt ?? a._creationTime ?? 0;
      const atB = b.lastActivityAt ?? b._creationTime ?? 0;
      return atB - atA;
    });
  }, [chats]);

  // Search query and filtered list
  const [q, setQ] = useState("");
  const filteredChats = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return sortedChats;
    return sortedChats.filter((c) => (c.name || "").toLowerCase().includes(s));
  }, [sortedChats, q]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflowX: "hidden" }}>
      {/* Header */}
      <SectionHeader
        title={collapsed ? "" : "Chats"}
        right={
          <>
            <IconButton
              size="small"
              aria-label="Go to chat home"
              onClick={onGoHome}
              sx={{
                color: "var(--secondary)",
                '&:hover': {
                  backgroundColor:
                    'color-mix(in oklab, var(--secondary), transparent 90%)',
                },
              }}
            >
              <Home size={16} />
            </IconButton>
            {!collapsed && (
              <Box
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.75,
                  px: 1,
                  height: 28,
                  width: 180,
                  maxWidth: 'min(240px, 100%)',
                  border: '1px solid color-mix(in oklab, var(--borderLight), transparent 30%)',
                  borderRadius: 999,
                  backgroundColor: 'color-mix(in oklab, var(--card), transparent 10%)',
                }}
              >
                <Search size={14} color="var(--textSecondary)" />
                <InputBase
                  placeholder="Search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  sx={{ flex: 1, color: 'var(--text)', fontSize: 13, lineHeight: 1 }}
                  inputProps={{ 'aria-label': 'search chats' }}
                />
              </Box>
            )}
            <IconButton
              size="small"
              sx={{
                color: "var(--secondary)",
                '&:hover': {
                  backgroundColor:
                    'color-mix(in oklab, var(--secondary), transparent 90%)',
                },
              }}
              onClick={handleOpenNewChat}
            >
              <MessageSquarePlus size={16} />
            </IconButton>
          </>
        }
      />

      {/* List */}
      <Box sx={{ overflowY: "auto", overflowX: "hidden", py: 0.5 }}>
        {!me || chats === undefined ? (
          <Typography variant="body2" sx={{ opacity: 0.7, px: 1.25, py: 1 }}>
            Loading chats…
          </Typography>
        ) : filteredChats.length === 0 ? (
          <Typography variant="body2" sx={{ opacity: 0.7, px: 1.25, py: 1 }}>
            No chats yet.
          </Typography>
        ) : (
          filteredChats.map((c) => (
            collapsed ? (
              <Box key={c._id} sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
                <Tooltip title={c.name} placement="right">
                  <Avatar
                    src={c.avatarUrl}
                    alt={c.name}
                    sx={{ width: 36, height: 36, cursor: 'pointer' }}
                    onClick={() => onSelect?.({ _id: c._id, name: c.name })}
                  />
                </Tooltip>
              </Box>
            ) : (
              <Box
                key={c._id}
                sx={{
                  width: "100%",
                  px: 1.25,
                  py: 1,
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  alignItems: "center",
                  gap: 1,
                  overflow: "hidden",
                  cursor: "pointer",
                  color: "color-mix(in oklab, var(--foreground), transparent 30%)",
                  backgroundColor: "color-mix(in oklab, var(--card), transparent 94%)",
                  borderRadius: 1,
                  position: "relative",
                  borderLeft: "3px solid transparent",
                  transition:
                    "transform .2s ease, box-shadow .2s ease, background-color .2s ease",
                  "&:hover": {
                    transform: "translateX(4px) scale(1.01)",
                    backgroundColor: "color-mix(in oklab, var(--primary), transparent 92%)",
                    boxShadow:
                      "0 4px 8px color-mix(in oklab, var(--foreground), transparent 95%)",
                    color: "var(--textPrimary)",
                    borderLeftColor: "var(--primary)",
                  },
                  "&::before": {
                    content: "''",
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 100%)",
                    transform: "translateX(-100%)",
                    transition: "transform .3s ease-out",
                  },
                  "&:hover::before": {
                    transform: "translateX(0)",
                  },
                }}
                onClick={() => onSelect?.({ _id: c._id, name: c.name })}
              >
                {/* Avatar */}
                {c.avatarUrl ? (
                  <Avatar src={c.avatarUrl} alt={c.name} sx={{ width: 28, height: 28 }} />
                ) : (
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, color-mix(in oklab, var(--primary), transparent 70%), color-mix(in oklab, var(--foreground), transparent 92%))",
                    }}
                  />
                )}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 500, color: 'var(--text)' }}>
                    {c.name}
                  </Typography>
                </Box>
                {(c.unreadCount ?? 0) > 0 && (
                  <Box
                    sx={{
                      ml: 1,
                      fontSize: 10,
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 10,
                      background: 'linear-gradient(45deg, color-mix(in oklab, var(--primary), transparent 20%), color-mix(in oklab, var(--secondary), transparent 20%))',
                      color: '#fff',
                      letterSpacing: 0.4,
                      minWidth: 16,
                      textAlign: 'center',
                    }}
                  >
                    {Math.min(c.unreadCount as number, 99)}
                  </Box>
                )}
              </Box>
            )
          ))
        )}
      </Box>

      {/* New Chat Modal */}
      <NewChatModal
        open={openNewChat}
        onClose={handleCloseNewChat}
        me={me as any}
        onCreated={(chat) => onSelect?.(chat)}
      />
    </Box>
  );
}




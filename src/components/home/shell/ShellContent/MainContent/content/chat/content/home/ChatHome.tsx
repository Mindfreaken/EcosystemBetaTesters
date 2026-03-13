"use client";

import React, { useMemo, useState, MouseEvent } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import { MessageSquarePlus, Search } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import GlowPilledButton from "@/components/ui/GlowPilledButton";
import glowStyles from "@/components/ui/GlowPilledButton.module.css";
import NewChatModal from "../sidebar/componants/NewChatModal";
import { themeVar } from "@/theme/registry";

export type HomeChatItem = {
  _id: string;
  name: string;
  avatarUrl?: string;
  lastActivityAt?: number;
  _creationTime: number;
  unreadCount?: number;
};

function ChatChip({ chat, meId, onSelect }: { chat: HomeChatItem; meId?: any; onSelect: (chat: { _id: string; name: string }) => void }) {
  const unread = useQuery(
    api.chat.functions.messages.getUnreadThreadCount as any,
    meId && chat?._id ? ({ chatId: chat._id as any, userId: meId as any } as any) : ("skip" as any)
  ) as number | undefined;
  const count = typeof unread === "number" ? unread : chat.unreadCount ?? 0;
  return (
    <GlowPilledButton
      key={chat._id}
      onClick={() => onSelect({ _id: chat._id, name: chat.name })}
      className={glowStyles["accentHover"]}
      glowColor={`color-mix(in oklab, ${themeVar("secondary")}, transparent 20%)`}
      style={{
        width: '100%',
        justifyContent: 'flex-start',
        padding: '6px 10px',
        background: `linear-gradient(90deg, color-mix(in oklab, ${themeVar("card")}, transparent 2%), color-mix(in oklab, ${themeVar("mutedForeground")}, transparent 90%))`,
        border: `1px solid color-mix(in oklab, ${themeVar("border")}, transparent 35%)`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        {chat.avatarUrl ? (
          <Avatar src={chat.avatarUrl} sx={{ width: 20, height: 20 }} />
        ) : (
          <Avatar sx={{ width: 20, height: 20, bgcolor: themeVar("secondary") }} />
        )}
        <Typography variant="body2" sx={{ color: themeVar("foreground") }} noWrap>
          {chat.name}
        </Typography>
        {(count ?? 0) > 0 && (
          <Box
            sx={{
              ml: 0.75,
              fontSize: 10,
              px: 0.75,
              py: 0.25,
              lineHeight: 1,
              borderRadius: 10,
              background: 'linear-gradient(45deg, color-mix(in oklab, var(--primary), transparent 20%), color-mix(in oklab, var(--secondary), transparent 20%))',
              color: '#fff',
              minWidth: 16,
              textAlign: 'center',
            }}
          >
            {Math.min(count as number, 99)}
          </Box>
        )}
      </Box>
    </GlowPilledButton>
  );
}

export default function ChatHome({
  onSelect,
}: {
  onSelect: (chat: { _id: string; name: string }) => void;
}) {
  const me = useQuery(api.users.onboarding.queries.me, {});
  const chats = useQuery(
    api.chat.functions.chats.getUserChats,
    me?._id ? ({ userId: me._id } as any) : ("skip" as any)
  ) as HomeChatItem[] | undefined;

  const baseChats: HomeChatItem[] = useMemo(() => {
    return Array.isArray(chats) ? chats : [];
  }, [chats]);

  const [q, setQ] = useState("");
  const sorted = useMemo(() => {
    if (!baseChats) return [] as HomeChatItem[];
    return [...baseChats].sort((a, b) => {
      const atA = a.lastActivityAt ?? a._creationTime ?? 0;
      const atB = b.lastActivityAt ?? b._creationTime ?? 0;
      return atB - atA;
    });
  }, [baseChats]);
  const filtered = useMemo(() => {
    if (!sorted) return [] as HomeChatItem[];
    const s = q.trim().toLowerCase();
    if (!s) return sorted;
    return sorted.filter((c) => (c.name || "").toLowerCase().includes(s));
  }, [sorted, q]);

  // New chat modal state
  const [openNewChat, setOpenNewChat] = useState(false);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Sticky Header with title, actions, and search */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          px: 2,
          pt: 2,
          pb: 1,
          background: `linear-gradient(180deg, color-mix(in oklab, ${themeVar("background")}, transparent 0%), color-mix(in oklab, ${themeVar("background")}, transparent 0%))`,
          borderBottom: `1px solid color-mix(in oklab, ${themeVar("border")}, transparent 40%)`,
          backdropFilter: 'saturate(120%)',
        }}
      >
        {/* Two-column header: left text, right actions. Search sits under New chat. */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'start',
            gap: 1.5,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ color: themeVar("foreground"), fontWeight: 600 }}>
              Welcome to Chats Home
            </Typography>
            <Typography variant="body2" sx={{ color: themeVar("mutedForeground") }}>
              Create a group or DM, or pick an existing conversation below. Note: Messages use Convex encryption in transit. End‑to‑end encryption isn’t available yet, so messages aren’t fully private.
              We plan to add E2E encryption when it’s safe and ready.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 380 }}>
            {/* Compact search to the LEFT */}
            <Box
              sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                px: 1,
                height: 34,
                width: 320,
                maxWidth: 'min(420px, 100%)',
                border: `1px solid color-mix(in oklab, ${themeVar("border")}, transparent 30%)`,
                borderRadius: 999,
                backgroundColor: `color-mix(in oklab, ${themeVar("card")}, transparent 10%)`,
              }}
              className={glowStyles["glow-pilled-button"]}
              onMouseMove={(e: MouseEvent<HTMLDivElement>) => {
                const el = e.currentTarget as HTMLElement;
                const rect = el.getBoundingClientRect();
                const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                el.style.setProperty('--glow-pos-x', `${x}%`);
                el.style.setProperty('--glow-pos-y', `${y}%`);
                el.style.setProperty('--glow-color', `color-mix(in oklab, ${themeVar("secondary")}, transparent 80%)`);
              }}
              onMouseLeave={(e: MouseEvent<HTMLDivElement>) => {
                const el = e.currentTarget as HTMLElement;
                el.style.setProperty('--glow-pos-x', '50%');
                el.style.setProperty('--glow-pos-y', '50%');
                el.style.removeProperty('--glow-color');
              }}
            >
              <Search size={14} style={{ color: themeVar("mutedForeground") }} />
              <InputBase
                placeholder="Search your chats"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                sx={{ flex: 1, color: themeVar("foreground"), fontSize: 14 }}
                inputProps={{ 'aria-label': 'search chats' }}
              />
            </Box>
            {/* New chat button to the RIGHT */}
            <GlowPilledButton
              onClick={() => setOpenNewChat(true)}
              glowColor={`color-mix(in oklab, ${themeVar("secondary")}, transparent 20%)`}
              style={{
                background: `linear-gradient(90deg, color-mix(in oklab, ${themeVar("secondary")}, transparent 80%), color-mix(in oklab, ${themeVar("primary")}, transparent 80%))`,
                color: themeVar("foreground"),
                border: `1px solid color-mix(in oklab, ${themeVar("border")}, transparent 20%)`,
                height: 34,
              }}
              icon={<MessageSquarePlus size={16} />}
              label="New chat"
            />
          </Box>
        </Box>
      </Box>

      {/* Chat bubbles grid */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {filtered.length === 0 ? (
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            No chats found.
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 1,
              alignItems: 'start',
              gridAutoRows: 'minmax(34px, auto)',
            }}
          >
            {filtered.map((c) => (
              <ChatChip key={c._id} chat={c} meId={me?._id} onSelect={onSelect} />
            ))}
          </Box>
        )}
      </Box>

      {/* Create Chat Modal (shared) */}
      <NewChatModal
        open={openNewChat}
        onClose={() => setOpenNewChat(false)}
        me={me as any}
        onCreated={(chat) => {
          setOpenNewChat(false);
          onSelect(chat);
        }}
      />
    </Box>
  );
}



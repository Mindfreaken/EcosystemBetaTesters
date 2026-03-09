"use client";

import React, { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import ChatListSidebar, { ChatListItem } from "./content/sidebar/ChatListSidebar";
import SectionHeader from "./content/header/SectionHeader";
import ChatHome from "./content/home/ChatHome";
import ChatThread from "./content/thread/ChatThread";
import IconButton from "@mui/material/IconButton";
import { PanelLeftOpen, PanelLeftClose, Settings } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import GroupSettingsModal from "./content/header/GroupSettingsModal";
import GlowPilledButton from "@/components/ui/GlowPilledButton";
import compactPillStyles from "./content/header/GlowCompactPill.module.css";
import { useShellView } from "../../../viewContext";

export default function ChatContent() {
  const [selected, setSelected] = useState<Pick<ChatListItem, "_id" | "name"> | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { selectedChatId, setSelectedChatId } = useShellView();

  // Current user
  const me = useQuery(api.users.onboarding.queries.me, {});

  // Resolve chat header title with display name if it's a DM
  const chatDetails = useQuery(
    api.chat.functions.chats.getChatDetails as any,
    selected?._id ? ({ chatId: selected._id } as any) : ("skip" as any)
  ) as any;
  const chatMembers = useQuery(
    api.chat.functions.chats.getChatMembers as any,
    selected?._id ? ({ chatId: selected._id } as any) : ("skip" as any)
  ) as Array<{ _id: string; displayName?: string; username?: string }>
    | undefined;

  const headerTitle = useMemo(() => {
    if (!selected) return "Select a chat";
    // Prefer resolved DM name when available
    if (chatDetails && chatMembers && me?._id) {
      if (chatDetails.isGroup) {
        return chatDetails.name || chatDetails.groupName || selected.name;
      }
      // DM: find other participant
      const other = chatMembers.find((m) => (m._id as any).toString() !== (me._id as any).toString());
      if (other) return other.displayName || other.username || selected.name;
    }
    return selected.name;
  }, [selected, chatDetails, chatMembers, me]);

  // If a chat id was preselected by another view, select it when Chat loads
  useEffect(() => {
    if (selectedChatId) {
      setSelected({ _id: selectedChatId, name: "Chat" });
      setSelectedChatId(null);
    }
  }, [selectedChatId, setSelectedChatId]);

  // When user selects a chat in Chat view, reflect it in URL by updating selectedChatId
  useEffect(() => {
    if (selected?._id) {
      setSelectedChatId(String(selected._id));
    }
  }, [selected?._id, setSelectedChatId]);

  return (
    <div className="flex h-full w-full">
      {!selected ? (
        // Chat Home: no sidebar/header/thread/composer
        <Box sx={{ flex: 1, height: "100%" }}>
          <ChatHome onSelect={(c) => setSelected(c)} />
        </Box>
      ) : (
        <>
          {/* Left: Chat list sidebar */}
          <Box
            sx={{
              width: sidebarCollapsed ? 76 : 260,
              minWidth: sidebarCollapsed ? 72 : 260,
              maxWidth: sidebarCollapsed ? 90 : 260,
              height: "100%",
              borderRight: "1px solid var(--borderLight)",
              backgroundColor: "color-mix(in oklab, var(--card), transparent 96%)",
              overflowX: "hidden",
            }}
          >
            <ChatListSidebar
              collapsed={sidebarCollapsed}
              onSelect={(c) => setSelected(c)}
              onGoHome={() => setSelected(null)}
            />
          </Box>

          {/* Right: Main chat area */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Header */}
            <SectionHeader
              title={headerTitle}
              left={
                <IconButton
                  size="small"
                  aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  onClick={() => setSidebarCollapsed((v) => !v)}
                  sx={{
                    color: "var(--secondary)",
                    '&:hover': {
                      backgroundColor: 'color-mix(in oklab, var(--secondary), transparent 90%)',
                    },
                  }}
                >
                  {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                </IconButton>
              }
              right={
                chatDetails?.isGroup ? (
                  <GlowPilledButton
                    aria-label="Group settings"
                    onClick={() => setSettingsOpen(true)}
                    glowColor="color-mix(in oklab, var(--secondary), transparent 20%)"
                    icon={<Settings size={16} />}
                    label="Settings"
                    className={compactPillStyles.compactGlow}
                    style={{
                      background: 'linear-gradient(90deg, color-mix(in oklab, var(--secondary), transparent 80%), color-mix(in oklab, var(--primary), transparent 80%))',
                      color: 'var(--text)',
                      border: '1px solid color-mix(in oklab, var(--border), transparent 20%)',
                    }}
                  />
                ) : null
              }
            />
            {selected && me?._id && chatDetails?.isGroup && (
              <GroupSettingsModal
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                chatId={selected._id as any}
                meId={me._id as any}
              />
            )}
            {/* Thread (messages + composer) */}
            {selected && <ChatThread chat={{ _id: selected._id, name: headerTitle || selected.name }} />}
          </Box>
        </>
      )}
    </div>
  );
}



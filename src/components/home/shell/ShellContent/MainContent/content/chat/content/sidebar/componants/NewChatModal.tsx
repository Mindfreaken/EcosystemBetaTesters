"use client";

import React, { useMemo, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import { Search, X } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { themeVar } from "@/theme/registry";

export type FriendDetail = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
};

export default function NewChatModal({
  open,
  onClose,
  me,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  me: { _id?: string; clerkUserId?: string } | undefined;
  onCreated: (chat: { _id: string; name: string }) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [friendSearch, setFriendSearch] = useState("");

  const createOrGetChat = useMutation(api.chat.functions.chats.createOrGetChat);

  // Friends data via Convex
  const friends = useQuery(
    api.users.friends.functions.getFriends.getFriends as any,
    me?.clerkUserId ? { clerkUserId: me.clerkUserId as string, status: "active" } : "skip"
  ) as Array<{ friendId: string }> | undefined;

  const friendIds = useMemo(() => (friends?.map((f) => f.friendId) ?? []), [friends]);
  const friendDetails = useQuery(
    api.users.onboarding.queries.getUsersDetailsByConvexId,
    friendIds.length > 0 ? { userIds: friendIds as any } : "skip"
  ) as FriendDetail[] | undefined;

  const friendDetailsList: FriendDetail[] = friendDetails ?? [];

  const filteredFriends = useMemo<FriendDetail[]>(() => {
    const q = friendSearch.trim().toLowerCase();
    if (!q) return friendDetailsList;
    return friendDetailsList.filter((u) =>
      (u.displayName || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q)
    );
  }, [friendDetailsList, friendSearch]);

  const toggleFriend = (id: string) => {
    setSelectedFriendIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 9) return prev; // Max 10 including me
      return [...prev, id];
    });
  };

  const canSubmit = !!me?._id && selectedFriendIds.length > 0 && !creating;

  const handleCreateChat = async () => {
    const chosenIds = selectedFriendIds;
    if (!me?._id || chosenIds.length === 0) return;
    try {
      setCreating(true);
      const chatId = await createOrGetChat({
        participantIds: chosenIds as any,
        creatorId: me._id as any,
      });
      // Close and optionally focus/select the new chat
      handleClose();
      onCreated({ _id: chatId as unknown as string, name: "New Chat" });
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (creating) return;
    setSelectedFriendIds([]);
    setFriendSearch("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      scroll="paper"
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          New chat
          {selectedFriendIds.length > 0 && (
            <Typography variant="caption" sx={{ color: selectedFriendIds.length >= 9 ? themeVar("destructive") : themeVar("primary"), fontWeight: 700 }}>
              ({selectedFriendIds.length + 1}/10 members)
            </Typography>
          )}
        </Box>
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{
            color: themeVar("mutedForeground"),
            ml: 1,
            '&:hover': { color: themeVar("foreground"), backgroundColor: 'transparent' },
          }}
        >
          <X size={16} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 0.5, pb: 0.8, px: 1.8, overflow: 'hidden' }}>
        <Typography variant="body2" sx={{ mb: 1, color: themeVar("mutedForeground"), fontSize: 13 }}>
          Start a new conversation by selecting up to 9 friends (max 10 members).
        </Typography>
        {/* Friends search */}
        <Box
          sx={{
            display: 'flex', alignItems: 'center', gap: 1, mb: 1.25,
            px: 1,
            border: `1px solid color-mix(in oklab, ${themeVar("border")}, transparent 15%)`,
            borderRadius: 999,
            backgroundColor: `color-mix(in oklab, ${themeVar("card")}, transparent 10%)`,
          }}
        >
          <Search size={14} style={{ color: themeVar("mutedForeground") }} />
          <InputBase
            placeholder="Search friends"
            value={friendSearch}
            onChange={(e) => setFriendSearch(e.target.value)}
            sx={{ flex: 1, color: themeVar("foreground") }}
            inputProps={{ 'aria-label': 'search friends' }}
          />
        </Box>
        {/* Friends list */}
        <Box sx={{ maxHeight: '50vh', overflowY: 'auto', overflowX: 'hidden', borderRadius: 1.5, mb: 0.5 }}>
          <List dense disablePadding>
            {(filteredFriends || []).map((u) => (
              <ListItemButton
                key={u.userId}
                onClick={() => toggleFriend(u.userId)}
                sx={{
                  py: 0.75,
                  px: 1.1,
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: 1.25,
                  my: 0.25,
                  backgroundColor: selectedFriendIds.includes(u.userId)
                    ? `color-mix(in oklab, ${themeVar("primary")}, transparent 92%)`
                    : 'transparent',
                  '&:hover': { backgroundColor: `color-mix(in oklab, ${themeVar("foreground")}, transparent 96%)` },
                }}
              >
                <ListItemAvatar>
                  {u.avatarUrl ? (
                    <Avatar src={u.avatarUrl} sx={{ width: 36, height: 36, boxShadow: `0 1px 4px color-mix(in oklab, ${themeVar("foreground")}, transparent 90%)` }} />
                  ) : (
                    <Avatar sx={{ width: 36, height: 36, bgcolor: themeVar("secondary"), boxShadow: `0 1px 4px color-mix(in oklab, ${themeVar("foreground")}, transparent 90%)` }} />
                  )}
                </ListItemAvatar>
                <ListItemText
                  primaryTypographyProps={{ noWrap: true, sx: { fontSize: 14, color: themeVar("foreground"), fontWeight: 600 } }}
                  secondaryTypographyProps={{ noWrap: true, sx: { fontSize: 12, color: themeVar("mutedForeground") } }}
                  primary={u.displayName}
                />
                <Checkbox
                  edge="end"
                  checked={selectedFriendIds.includes(u.userId)}
                  disabled={!selectedFriendIds.includes(u.userId) && selectedFriendIds.length >= 9}
                  tabIndex={-1}
                  disableRipple
                  size="small"
                  sx={{ ml: 1 }}
                />
              </ListItemButton>
            ))}
            {filteredFriends && filteredFriends.length === 0 && (
              <Typography variant="body2" sx={{ px: 1, py: 1, color: themeVar("mutedForeground") }}>
                No friends found.
              </Typography>
            )}
          </List>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 1.8, py: 1.2, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={creating}
          sx={{
            color: themeVar("mutedForeground"),
            fontSize: 13,
            px: 1.25,
            minWidth: 0,
            '&:hover': { backgroundColor: `color-mix(in oklab, ${themeVar("foreground")}, transparent 96%)` },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCreateChat}
          disabled={!canSubmit}
          startIcon={creating ? <CircularProgress size={14} /> : undefined}
          sx={{
            backgroundColor: themeVar("primary"),
            color: 'white',
            px: 1.25,
            py: 0.4,
            fontSize: 13,
            boxShadow: `0 3px 8px color-mix(in oklab, ${themeVar("primary")}, transparent 80%)`,
            '&:hover': {
              backgroundColor: `color-mix(in oklab, ${themeVar("primary")}, transparent 10%)`,
              boxShadow: `0 4px 10px color-mix(in oklab, ${themeVar("primary")}, transparent 75%)`,
            },
            '&:disabled': {
              backgroundColor: `${themeVar("foreground")}1a`,
              boxShadow: 'none',
              color: 'rgba(255,255,255,0.7)'
            }
          }}
          size="small"
        >
          {creating ? "Creating…" : `Create${selectedFriendIds.length ? ` (${selectedFriendIds.length})` : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}



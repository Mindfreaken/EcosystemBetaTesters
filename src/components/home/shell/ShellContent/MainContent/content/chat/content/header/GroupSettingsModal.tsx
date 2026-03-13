"use client";

import React, { useMemo, useState } from "react";
import { useConvex } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import { useConvexStorage } from "../../../../../../../../../services/convexStorage";
import { useQuery } from "convex/react";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import { X, Search, UserPlus, UserMinus, Crown } from "lucide-react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { themeVar } from "@/theme/registry";

interface GroupSettingsModalProps {
  open: boolean;
  onClose: () => void;
  chatId: Id<"chats">;
  meId: Id<"users">;
}

export default function GroupSettingsModal({ open, onClose, chatId, meId }: GroupSettingsModalProps) {
  const convex = useConvex();
  const { uploadFile } = useConvexStorage();

  const chatDetails = useQuery(api.chat.functions.chats.getChatDetails as any, { chatId } as any) as any;

  const isCreator = useMemo(() => {
    if (!chatDetails || !meId) return false;
    return (chatDetails.createdBy as string).toString() === (meId as any).toString();
  }, [chatDetails, meId]);

  const [name, setName] = useState<string>("");
  const [initialName, setInitialName] = useState<string>("");
  const [nameError, setNameError] = useState<string>("");
  const [savingName, setSavingName] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [tab, setTab] = useState<'leader' | 'members' | 'add'>('leader');
  const [friendSearch, setFriendSearch] = useState("");

  React.useEffect(() => {
    if (chatDetails) {
      const resolved = chatDetails.name || chatDetails.groupName || "";
      setName(resolved);
      setInitialName(resolved);
      setAvatarPreview(chatDetails.groupAvatarUrl);
    }
  }, [chatDetails]);

  // Default to Members tab if user is not creator
  React.useEffect(() => {
    if (!isCreator) setTab('members');
  }, [isCreator]);

  const handleSaveName = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setNameError("Group name is required");
      return;
    }
    if (trimmed.length > 25) {
      setNameError("Max 25 characters");
      return;
    }
    setNameError("");
    setSavingName(true);
    try {
      await convex.mutation(api.chat.functions.chats.updateChatName as any, {
        chatId,
        newName: trimmed,
        currentUserId: meId,
      } as any);
    } catch (e: any) {
      setNameError(e?.message ?? "Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const handleAvatarChange = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadFile(file, `chats/${chatId}/avatar`, meId, chatId);
      const url = result.downloadUrl;
      await convex.mutation(api.chat.functions.chats.updateChatAvatar as any, {
        chatId,
        newAvatarUrl: url,
        currentUserId: meId,
      } as any);
      setAvatarPreview(url);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleLeave = async () => {
    try {
      await convex.mutation(api.chat.functions.chats.leaveChat as any, {
        chatId,
        currentUserId: meId,
        preventReAdd: false,
      } as any);
      setConfirmLeaveOpen(false);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMember = async (friendId: Id<"users">) => {
    try {
      await convex.mutation(api.chat.functions.chats.addUserToChat as any, {
        chatId,
        userIdToAdd: friendId,
        currentUserId: meId,
      } as any);
    } catch (e) {
      console.error(e);
    }
  };

  const handleKickMember = async (userIdToKick: Id<"users">) => {
    try {
      await convex.mutation(api.chat.functions.chats.kickUserFromChat as any, {
        chatId,
        userIdToKick,
        currentUserId: meId,
      } as any);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTransferOwnership = async (newOwnerId: Id<"users">) => {
    try {
      await convex.mutation(api.chat.functions.chats.transferOwnership as any, {
        chatId,
        newOwnerId,
        currentUserId: meId,
      } as any);
    } catch (e) {
      console.error(e);
    }
  };

  // Chat members data
  const members = useQuery(api.chat.functions.chats.getChatMembers as any, { chatId } as any) as any[] | undefined;

  // Friends data for adding members
  const me = useQuery(api.users.onboarding.queries.me, {});
  const friends = useQuery(
    api.users.friends.functions.getFriends.getFriends as any,
    me?.clerkUserId ? { clerkUserId: me.clerkUserId as string, status: "active" } : "skip"
  ) as Array<{ friendId: string }> | undefined;

  const friendIds = useMemo(() => (friends?.map((f) => f.friendId) ?? []), [friends]);
  const friendDetails = useQuery(
    api.users.onboarding.queries.getUsersDetailsByConvexId,
    friendIds.length > 0 ? { userIds: friendIds as any } : "skip"
  ) as any[] | undefined;

  const filteredFriends = useMemo(() => {
    if (!friendDetails || !chatDetails) return [];
    const participants = new Set(chatDetails.participants.map((p: any) => p.toString()));
    const q = friendSearch.trim().toLowerCase();
    return friendDetails.filter((f: any) => 
      !participants.has(f.userId.toString()) &&
      ((f.displayName || "").toLowerCase().includes(q) || (f.username || "").toLowerCase().includes(q))
    );
  }, [friendDetails, chatDetails, friendSearch]);

  const disabledFields = !isCreator;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
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
          Group settings
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ color: themeVar("mutedForeground"), ml: 1, '&:hover': { color: themeVar("foreground"), backgroundColor: 'transparent' } }}
          >
            <X size={16} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0.5, pb: 0.8, px: 1.8, overflow: 'hidden', minHeight: 240 }}>
          {/* Tabs */}
          <Box sx={{ borderBottom: '1px solid color-mix(in oklab, var(--border), transparent 35%)', mb: 1 }}>
            <Tabs
              value={tab}
              onChange={(_e, v) => setTab(v)}
              variant="fullWidth"
              sx={{
                minHeight: 36,
                '& .MuiTab-root': { minHeight: 36, textTransform: 'none', color: themeVar("mutedForeground") },
                '& .Mui-selected': { color: themeVar("foreground") },
                '& .MuiTabs-indicator': { backgroundColor: themeVar("primary") },
              }}
            >
               {isCreator && <Tab value="leader" label="Group leader" />}
              <Tab value="members" label="Members" />
              <Tab value="add" label="Add members" />
            </Tabs>
          </Box>

          {/* Tab content */}
          {tab === 'leader' && isCreator && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar src={avatarPreview} sx={{ width: 56, height: 56, border: `1px solid ${themeVar("border")}` }} />
                <Box>
                  <Button
                    variant="outlined"
                    size="small"
                    component="label"
                    disabled={!isCreator || uploading}
                    sx={{
                      textTransform: 'none',
                      borderColor: themeVar("border"),
                      color: themeVar("secondary"),
                      '&:hover': {
                        backgroundColor: `color-mix(in oklab, ${themeVar("secondary")}, transparent 92%)`,
                        borderColor: themeVar("border"),
                      },
                    }}
                  >
                    {uploading ? <CircularProgress size={16} /> : 'Change avatar'}
                    <input hidden type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarChange(f); }} />
                  </Button>
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: themeVar("mutedForeground") }}>Group name</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, border: `1px solid color-mix(in oklab, ${themeVar("border")}, transparent 15%)`, borderRadius: 999, backgroundColor: `color-mix(in oklab, ${themeVar("card")}, transparent 10%)` }}>
                  <InputBase value={name} onChange={(e) => setName(e.target.value.slice(0, 25))} sx={{ flex: 1, color: themeVar("foreground") }} inputProps={{ 'aria-label': 'group name', maxLength: 25 }} />
                </Box>
                <Typography variant="caption" sx={{ mt: 0.5, color: nameError ? themeVar("destructive") : themeVar("mutedForeground") }}>
                  {nameError || `${name.length}/25 characters`}
                </Typography>
              </Box>

              <Box>
                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => setConfirmDeleteOpen(true)}
                  sx={{
                    borderColor: `color-mix(in oklab, ${themeVar("destructive")}, transparent 30%)`,
                    color: themeVar("destructive"),
                    '&:hover': { backgroundColor: `color-mix(in oklab, ${themeVar("destructive")}, transparent 92%)` },
                  }}
                >
                  Destroy group
                </Button>
              </Box>
            </Box>
          )}

          {tab === 'members' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 1, color: themeVar("mutedForeground") }}>
                  Current members: {chatDetails?.participants?.length ?? 0}/10
                </Typography>
                
                <Box sx={{ maxHeight: 240, overflowY: 'auto', mb: 2 }}>
                  <List dense>
                    {(members || []).map((m: any) => (
                      <ListItem
                        key={m._id}
                        secondaryAction={
                          isCreator && m._id.toString() !== meId.toString() && (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton 
                                edge="end" 
                                size="small" 
                                onClick={() => handleTransferOwnership(m._id)}
                                title="Transfer Ownership"
                                sx={{ color: themeVar("primary") }}
                              >
                                <Crown size={16} />
                              </IconButton>
                              <IconButton 
                                edge="end" 
                                size="small" 
                                onClick={() => handleKickMember(m._id)}
                                title="Kick Member"
                                sx={{ color: themeVar("destructive") }}
                              >
                                <UserMinus size={16} />
                              </IconButton>
                            </Box>
                          )
                        }
                        sx={{ px: 1 }}
                      >
                        <ListItemAvatar sx={{ minWidth: 40 }}>
                          <Avatar src={m.avatarUrl} sx={{ width: 32, height: 32 }} />
                        </ListItemAvatar>
                        <ListItemText 
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {m.displayName || m.username}
                              {m.isCreator && (
                                <Typography variant="caption" sx={{ color: themeVar("primary"), bgcolor: `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)`, px: 0.5, borderRadius: 1 }}>
                                  Owner
                                </Typography>
                              )}
                            </Box>
                          }
                          primaryTypographyProps={{ fontSize: 13, fontWeight: 500, color: themeVar("foreground") }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => setConfirmLeaveOpen(true)}
                  sx={{
                    borderColor: `color-mix(in oklab, ${themeVar("destructive")}, transparent 30%)`,
                    color: themeVar("destructive"),
                    '&:hover': { backgroundColor: `color-mix(in oklab, ${themeVar("destructive")}, transparent 92%)` },
                    width: '100%',
                  }}
                >
                  Leave group
                </Button>
              </Box>
            </Box>
          )}

          {tab === 'add' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: themeVar("mutedForeground") }}>
                Add up to {10 - (chatDetails?.participants?.length ?? 0)} more members (max 10)
              </Typography>
              
              <Box sx={{ 
                display: 'flex', alignItems: 'center', gap: 1, px: 1, 
                border: `1px solid color-mix(in oklab, ${themeVar("border")}, transparent 15%)`, 
                borderRadius: 999, backgroundColor: `color-mix(in oklab, ${themeVar("card")}, transparent 10%)` 
              }}>
                <Search size={14} style={{ color: themeVar("mutedForeground") }} />
                <InputBase 
                  placeholder="Search friends" 
                  value={friendSearch} 
                  onChange={(e) => setFriendSearch(e.target.value)} 
                  sx={{ flex: 1, color: themeVar("foreground"), fontSize: 13 }} 
                />
              </Box>

              <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                <List dense>
                  {filteredFriends.map((f: any) => (
                    <ListItem
                      key={f.userId}
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          size="small"
                          disabled={(chatDetails?.participants?.length ?? 0) >= 10}
                          onClick={() => handleAddMember(f.userId)}
                          sx={{ color: themeVar("primary") }}
                        >
                          <UserPlus size={16} />
                        </IconButton>
                      }
                      sx={{ px: 1 }}
                    >
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar src={f.avatarUrl} sx={{ width: 32, height: 32 }} />
                      </ListItemAvatar>
                      <ListItemText 
                        primary={f.displayName || f.username} 
                        primaryTypographyProps={{ fontSize: 13, fontWeight: 500, color: themeVar("foreground") }}
                      />
                    </ListItem>
                  ))}
                  {filteredFriends.length === 0 && (
                    <Typography variant="caption" sx={{ px: 1, color: themeVar("mutedForeground") }}>
                      No more friends to add.
                    </Typography>
                  )}
                </List>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 1.8, py: 1.2, gap: 1, minHeight: 44 }}>
          <Button
            onClick={onClose}
            sx={{
              color: themeVar("mutedForeground"),
              fontSize: 13,
              px: 1.25,
              minWidth: 0,
              '&:hover': { backgroundColor: `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)`, color: themeVar("primary") },
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveName}
            disabled={!isCreator || disabledFields || savingName || name.trim() === initialName.trim() || tab !== 'leader'}
            startIcon={tab === 'leader' && savingName ? <CircularProgress size={14} /> : undefined}
            sx={{
              backgroundColor: themeVar("primary"),
              color: 'white',
              px: 1.25,
              py: 0.4,
              fontSize: 13,
              boxShadow: `0 3px 8px color-mix(in oklab, ${themeVar("primary")}, transparent 80%)`,
              '&:hover': { backgroundColor: `color-mix(in oklab, ${themeVar("primary")}, transparent 10%)` },
              '&:disabled': { backgroundColor: `${themeVar("foreground")}1a`, boxShadow: 'none', color: 'rgba(255,255,255,0.7)' },
              // Keep the button occupying space when not on leader tab
              visibility: tab === 'leader' && isCreator ? 'visible' : 'hidden',
            }}
            size="small"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      {/* Leave group confirm dialog */}
      <Dialog
        open={confirmLeaveOpen}
        onClose={() => setConfirmLeaveOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'color-mix(in oklab, var(--overlay), transparent 20%)',
              backdropFilter: 'blur(4px)',
            },
          },
          paper: {
            sx: {
              background: `color-mix(in oklab, ${themeVar("card")}, transparent 5%)`,
              border: `1px solid color-mix(in oklab, ${themeVar("border")}, transparent 35%)`,
              boxShadow: `0 6px 18px color-mix(in oklab, ${themeVar("foreground")}, transparent 95%)`,
              borderRadius: '9px',
            }
          },
        }}
      >
        <DialogTitle sx={{ color: themeVar("foreground"), fontWeight: 700, fontSize: 16 }}>Leave group?</DialogTitle>
        <DialogContent sx={{ color: themeVar("mutedForeground") }}>
          {isCreator 
            ? "Ownership will be automatically transferred to an admin or member. You can be added back later by a member." 
            : "You can be added back later by a member."
          }
        </DialogContent>
        <DialogActions sx={{ px: 1.8, py: 1.2, gap: 1 }}>
          <Button onClick={() => setConfirmLeaveOpen(false)} sx={{ color: themeVar("mutedForeground") }}>Cancel</Button>
          <Button variant="outlined" color="error" onClick={handleLeave}>Leave</Button>
        </DialogActions>
      </Dialog>
      {/* Destroy group confirm dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'color-mix(in oklab, var(--overlay), transparent 20%)',
              backdropFilter: 'blur(4px)',
            },
          },
          paper: {
            sx: {
              background: `color-mix(in oklab, ${themeVar("card")}, transparent 5%)`,
              border: `1px solid color-mix(in oklab, ${themeVar("border")}, transparent 35%)`,
              boxShadow: `0 6px 18px color-mix(in oklab, ${themeVar("foreground")}, transparent 95%)`,
              borderRadius: '9px',
            }
          }
        }}
      >
        <DialogTitle sx={{ color: themeVar("foreground"), fontWeight: 700, fontSize: 16 }}>Destroy group?</DialogTitle>
        <DialogContent sx={{ color: themeVar("mutedForeground") }}>
          This will permanently delete the group and all messages for all members. This action cannot be undone.
        </DialogContent>
        <DialogActions sx={{ px: 1.8, py: 1.2, gap: 1 }}>
          <Button onClick={() => setConfirmDeleteOpen(false)} sx={{ color: themeVar("mutedForeground") }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={async () => {
            try {
              await convex.mutation(api.chat.functions.chats.deleteChat as any, { chatId, currentUserId: meId } as any);
              setConfirmDeleteOpen(false);
              onClose();
            } catch (e) { console.error(e); }
          }}>Destroy</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}



"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { themeVar } from "@/theme/registry";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Avatar from "@mui/material/Avatar";
import InputAdornment from "@mui/material/InputAdornment";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import Switch from "@mui/material/Switch";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import { Search, Plus, Link, Trophy, Trash2, ShieldAlert, FileText, UserMinus } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Doc, Id } from "convex/_generated/dataModel";
import MemberNotesDialog from "../MemberNotesDialog";
import InvitedMembersDialog from "./InvitedMembersDialog";

interface MembersTabProps {
    space: Doc<"spaces">;
    role: "owner" | "admin" | "moderator";
    userRole?: string;
}

export default function MembersTab({ space, role, userRole }: MembersTabProps) {
    const members = useQuery(api.spaces.members.getSpaceMembers, { spaceId: space._id });
    const invites = useQuery(api.spaces.invites.getSpaceInvites, { spaceId: space._id });
    const leaderboard = useQuery(api.spaces.invites.getInviteLeaderboard, { spaceId: space._id });

    const createInvite = useMutation(api.spaces.invites.createInvite);
    const revokeInvite = useMutation(api.spaces.invites.revokeInvite);
    const toggleInvites = useMutation(api.spaces.invites.toggleInvites);
    const revokeAllInvites = useMutation(api.spaces.invites.revokeAllInvites);
    const kickMember = useMutation(api.spaces.members.kickMember);
    const setRole = useMutation(api.spaces.members.setMemberRole);

    const [searchQuery, setSearchQuery] = React.useState("");
    const [creatingInvite, setCreatingInvite] = React.useState(false);
    const [notesDialogOpen, setNotesDialogOpen] = React.useState(false);
    const [notesDialogMember, setNotesDialogMember] = React.useState<any>(null);
    const [invitedMembersDialog, setInvitedMembersDialog] = React.useState<{ open: boolean; inviterId: Id<"users"> | null; inviterName: string; }>({ open: false, inviterId: null, inviterName: "" });

    const [confirmDialog, setConfirmDialog] = React.useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        confirmLabel?: string;
        isDanger?: boolean;
    }>({
        open: false, title: "", message: "", onConfirm: () => { }
    });

    const handleCreateInviteCode = async () => {
        setCreatingInvite(true);
        try {
            await createInvite({ spaceId: space._id });
        } finally {
            setCreatingInvite(false);
        }
    };

    const filteredMembers = members?.filter((m: any) =>
        m.user?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user?._id.toString().includes(searchQuery)
    );

    const canManageRoles = role === "owner" || role === "admin";
    const canManageInvites = role === "owner" || role === "admin";

    return (
        <Box sx={{ maxWidth: 1200 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: canManageInvites ? "1fr 400px" : "1fr", gap: 4 }}>
                {/* Member Management Section */}
                <Box>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("mutedForeground") }}>MEMBER MANAGEMENT</Typography>
                        <TextField
                            size="small" placeholder="Search members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Search size={14} style={{ color: themeVar("mutedForeground") }} /></InputAdornment>,
                                sx: {
                                    fontSize: "0.8rem",
                                    height: 32,
                                    bgcolor: `color-mix(in oklab, ${themeVar("background")}, transparent 20%)`,
                                    color: themeVar("foreground"),
                                    border: `1px solid ${themeVar("border")}`,
                                    borderRadius: 1,
                                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                                    "& input::placeholder": { color: themeVar("mutedForeground"), opacity: 1 }
                                }
                            }}
                        />
                    </Box>
                    <Stack spacing={1} sx={{ maxHeight: 600, overflowY: "auto", pr: 1 }}>
                        {filteredMembers?.map((member: any) => (
                            <Box
                                key={member._id}
                                sx={{
                                    p: 2, borderRadius: 2, bgcolor: `color-mix(in oklab, ${themeVar("muted")}, transparent 50%)`, border: `1px solid ${themeVar("border")}`,
                                    display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.2s ease",
                                    "&:hover": { borderColor: themeVar("primary") }
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <Avatar src={member.user?.avatarUrl} sx={{ width: 40, height: 40 }} />
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, color: themeVar("foreground") }}>{member.user?.displayName || "User"}</Typography>
                                        <Typography variant="caption" sx={{ color: themeVar("mutedForeground") }}>Joined {new Date(member.joinedAt).toLocaleDateString()}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box sx={{
                                        px: 1, py: 0.25, borderRadius: 1, mr: 1,
                                    bgcolor: member.role === "owner" ? `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)` : member.role === "admin" ? `color-mix(in oklab, ${themeVar("secondary")}, transparent 90%)` : member.role === "moderator" ? `color-mix(in oklab, ${themeVar("chart4")}, transparent 90%)` : `color-mix(in oklab, ${themeVar("foreground")}, transparent 95%)`,
                                    border: `1px solid ${member.role === "owner" ? themeVar("primary") : member.role === "admin" ? themeVar("secondary") : member.role === "moderator" ? themeVar("chart4") : themeVar("border")}`
                                }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: member.role === "owner" ? themeVar("primary") : member.role === "admin" ? themeVar("secondary") : member.role === "moderator" ? themeVar("chart4") : themeVar("mutedForeground") }}>
                                        {member.role.toUpperCase()}
                                    </Typography>
                                </Box>

                                    <Tooltip title="View Notes">
                                        <IconButton size="small" sx={{ color: themeVar("mutedForeground"), "&:hover": { bgcolor: `color-mix(in oklab, ${themeVar("foreground")}, transparent 90%)`, color: themeVar("foreground") } }} onClick={() => { setNotesDialogMember(member); setNotesDialogOpen(true); }}>
                                            <FileText size={18} />
                                        </IconButton>
                                    </Tooltip>

                                    {/* Permission checks for kicking: Owner can kick anyone but owner, Admin can kick mods and members, Mod can only kick members */}
                                    {member.userId !== space.ownerId && (
                                        (role === "owner") ||
                                        (role === "admin" && member.role !== "owner" && member.role !== "admin") ||
                                        (role === "moderator" && member.role === "member")
                                    ) && (
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                {canManageRoles && member.role === "member" && (
                                                    <Tooltip title={`Promote to ${role === "owner" ? "Admin" : "Moderator"}`}>
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: themeVar("chart4") }}
                                                            onClick={() => {
                                                                const promoteTo = role === "owner" ? "admin" : "moderator";
                                                                setConfirmDialog({
                                                                    open: true, title: "Promote Member", message: `Promote ${member.user?.displayName} to ${promoteTo}?`, confirmLabel: "Promote", isDanger: false,
                                                                    onConfirm: async () => { await setRole({ spaceId: space._id, userId: member.userId, role: promoteTo }); setConfirmDialog(prev => ({ ...prev, open: false })); }
                                                                });
                                                            }}
                                                        >
                                                            <ShieldAlert size={18} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {canManageRoles && member.role === "moderator" && role === "owner" && (
                                                    <Tooltip title="Promote to Admin">
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: themeVar("secondary") }}
                                                            onClick={() => {
                                                                setConfirmDialog({
                                                                    open: true, title: "Promote Member", message: `Promote ${member.user?.displayName} to Admin?`, confirmLabel: "Promote", isDanger: false,
                                                                    onConfirm: async () => { await setRole({ spaceId: space._id, userId: member.userId, role: "admin" }); setConfirmDialog(prev => ({ ...prev, open: false })); }
                                                                });
                                                            }}
                                                        >
                                                            <ShieldAlert size={18} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {canManageRoles && (member.role === "admin" || member.role === "moderator") && role === "owner" && (
                                                    <Tooltip title="Demote to Member">
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: themeVar("mutedForeground") }}
                                                            onClick={() => {
                                                                setConfirmDialog({
                                                                    open: true, title: "Demote Member", message: `Demote ${member.user?.displayName} to regular member?`, confirmLabel: "Demote", isDanger: true,
                                                                    onConfirm: async () => { await setRole({ spaceId: space._id, userId: member.userId, role: "member" }); setConfirmDialog(prev => ({ ...prev, open: false })); }
                                                                });
                                                            }}
                                                        >
                                                            <UserMinus size={18} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}

                                                <Tooltip title="Kick Member">
                                                    <IconButton
                                                        size="small" sx={{ color: themeVar("destructive") }}
                                                        onClick={() => {
                                                            setConfirmDialog({
                                                                open: true, title: "Kick Member", message: `Are you sure you want to kick ${member.user?.displayName}? They will need a new invite to join back.`, confirmLabel: "Kick", isDanger: true,
                                                                onConfirm: async () => { await kickMember({ spaceId: space._id, targetUserId: member.userId }); setConfirmDialog(prev => ({ ...prev, open: false })); }
                                                            });
                                                        }}
                                                    >
                                                        <UserMinus size={18} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        )}
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                </Box>

                {/* Sidebar: Invite Management */}
                {canManageInvites && (
                    <Stack spacing={4}>
                        <Box>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("mutedForeground") }}>INVITE MANAGEMENT</Typography>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Tooltip title={space.allowInvites !== false ? "Disable Invites for Space" : "Enable Invites for Space"}>
                                        <Switch
                                            size="small"
                                            checked={space.allowInvites !== false}
                                            onChange={(e) => toggleInvites({ spaceId: space._id, allowInvites: e.target.checked })}
                                            sx={{
                                                '& .MuiSwitch-switchBase.Mui-checked': {
                                                    color: themeVar("primary"),
                                                    '& + .MuiSwitch-track': {
                                                        backgroundColor: themeVar("primary"),
                                                        opacity: 0.5,
                                                    },
                                                },
                                                '& .MuiSwitch-switchBase': {
                                                    color: themeVar("destructive"),
                                                },
                                                '& .MuiSwitch-track': {
                                                    backgroundColor: themeVar("destructive"),
                                                    opacity: 0.5,
                                                }
                                            }}
                                        />
                                    </Tooltip>
                                    <Tooltip title="Revoke All Active Invites">
                                        <span>
                                            <IconButton size="small" onClick={() => {
                                                setConfirmDialog({
                                                    open: true, title: "Revoke All Invites", message: "Are you sure you want to revoke all active invite codes? Existing users are not affected, but all outstanding links will become invalid.", confirmLabel: "Revoke All", isDanger: true,
                                                    onConfirm: async () => { await revokeAllInvites({ spaceId: space._id }); setConfirmDialog(prev => ({ ...prev, open: false })); }
                                                });
                                            }} sx={{ color: themeVar("destructive") }} disabled={!invites || invites.length === 0}>
                                                <Trash2 size={20} />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title="Create New Invite">
                                        <span>
                                            <IconButton size="small" disabled={creatingInvite || space.allowInvites === false} onClick={handleCreateInviteCode} sx={{ color: themeVar("primary") }}>
                                                <Plus size={20} />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </Box>
                            </Box>

                            <Box sx={{ p: 2, borderRadius: 2, bgcolor: `color-mix(in oklab, ${themeVar("muted")}, transparent 50%)`, border: `1px solid ${themeVar("border")}` }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: themeVar("mutedForeground"), mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                    <Trophy size={14} /> LEADERBOARD
                                </Typography>
                                <Stack spacing={1} sx={{ maxHeight: 250, overflowY: "auto" }}>
                                    {leaderboard?.map((entry: any, index: number) => (
                                        <Box
                                            key={entry.userId}
                                            onClick={() => setInvitedMembersDialog({ open: true, inviterId: entry.userId, inviterName: entry.displayName })}
                                            sx={{
                                                display: "flex", alignItems: "center", justifyContent: "space-between", p: 1,
                                                borderRadius: 1, cursor: "pointer", transition: "all 0.2s ease",
                                                "&:hover": { bgcolor: `color-mix(in oklab, ${themeVar("foreground")}, transparent 95%)` }
                                            }}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 900, color: index === 0 ? themeVar("chart3") : themeVar("mutedForeground"), width: 12 }}>{index + 1}.</Typography>
                                                <Avatar src={entry.avatarUrl} sx={{ width: 24, height: 24 }} />
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: themeVar("foreground"), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.displayName}</Typography>
                                            </Box>
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: themeVar("primary") }}>{entry.count}</Typography>
                                        </Box>
                                    ))}
                                    {(!leaderboard || leaderboard.length === 0) && (
                                        <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontStyle: "italic", textAlign: "center", py: 2, display: "block" }}>No leaderboard data.</Typography>
                                    )}
                                </Stack>
                            </Box>
                        </Box>
                    </Stack>
                )}
            </Box>

            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))} PaperProps={{ sx: { bgcolor: themeVar("muted"), color: themeVar("foreground"), backgroundImage: "none" } }}>
                <DialogTitle>{confirmDialog.title}</DialogTitle>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))} sx={{ color: themeVar("mutedForeground") }}>Cancel</Button>
                    <Button variant="contained" onClick={confirmDialog.onConfirm} sx={{ bgcolor: confirmDialog.isDanger ? themeVar("destructive") : themeVar("primary"), color: themeVar("foreground") }}>{confirmDialog.confirmLabel}</Button>
                </DialogActions>
            </Dialog>

            {
                notesDialogOpen && notesDialogMember && (
                    <MemberNotesDialog
                        open={notesDialogOpen}
                        onClose={() => setNotesDialogOpen(false)}
                        spaceId={space._id}
                        userId={notesDialogMember.userId}
                        username={notesDialogMember.user?.displayName || "User"}
                        avatarUrl={notesDialogMember.user?.avatarUrl}
                        myRole={role}
                    />
                )
            }

            {
                invitedMembersDialog.open && invitedMembersDialog.inviterId && (
                    <InvitedMembersDialog
                        open={invitedMembersDialog.open}
                        onClose={() => setInvitedMembersDialog(prev => ({ ...prev, open: false }))}
                        spaceId={space._id}
                        inviterId={invitedMembersDialog.inviterId!}
                        inviterName={invitedMembersDialog.inviterName}
                    />
                )
            }
        </Box >
    );
}



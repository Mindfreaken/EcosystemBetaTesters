import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import { X } from "lucide-react";
import { themeVar } from "@/theme/registry";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

interface InvitedMembersDialogProps {
    open: boolean;
    onClose: () => void;
    spaceId: Id<"spaces">;
    inviterId: Id<"users">;
    inviterName: string;
}

export default function InvitedMembersDialog({ open, onClose, spaceId, inviterId, inviterName }: InvitedMembersDialogProps) {
    const invitedMembers = useQuery(api.spaces.invites.getInvitedMembers, open ? { spaceId, inviterId } : "skip");

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: themeVar("muted"),
                    color: themeVar("foreground"),
                    backgroundImage: "none",
                    borderRadius: 3
                }
            }}
        >
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Users invited by {inviterName}</Typography>
                <IconButton onClick={onClose} size="small" sx={{ color: themeVar("mutedForeground") }}>
                    <X size={20} />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {invitedMembers === undefined && (
                    <Box sx={{ p: 4, textAlign: "center", color: themeVar("mutedForeground") }}>
                        <Typography>Loading...</Typography>
                    </Box>
                )}
                {invitedMembers && invitedMembers.length === 0 && (
                    <Box sx={{ p: 4, textAlign: "center", color: themeVar("mutedForeground") }}>
                        <Typography>No users found.</Typography>
                    </Box>
                )}
                {invitedMembers && invitedMembers.length > 0 && (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {invitedMembers.map((member) => (
                            <Box key={member.userId} sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                p: 2,
                                borderRadius: 2,
                                bgcolor: `color-mix(in oklab, ${themeVar("foreground")}, transparent 95%)`,
                                border: `1px solid ${themeVar("border")}`
                            }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <Avatar src={member.avatarUrl} sx={{ width: 40, height: 40 }} />
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, color: themeVar("foreground") }}>{member.displayName}</Typography>
                                        <Typography variant="caption" sx={{ color: themeVar("mutedForeground") }}>
                                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{
                                    px: 1, py: 0.25, borderRadius: 1,
                                    bgcolor: member.role === "owner" ? `color-mix(in oklab, ${themeVar("primary")}, transparent 90%)` : member.role === "admin" ? `color-mix(in oklab, ${themeVar("secondary")}, transparent 90%)` : member.role === "moderator" ? `color-mix(in oklab, ${themeVar("chart4")}, transparent 90%)` : `color-mix(in oklab, ${themeVar("foreground")}, transparent 95%)`,
                                    border: `1px solid ${member.role === "owner" ? themeVar("primary") : member.role === "admin" ? themeVar("secondary") : member.role === "moderator" ? themeVar("chart4") : themeVar("border")}`
                                }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: member.role === "owner" ? themeVar("primary") : member.role === "admin" ? themeVar("secondary") : member.role === "moderator" ? themeVar("chart4") : themeVar("mutedForeground") }}>
                                        {member.role.toUpperCase()}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                )}
            </DialogContent>
        </Dialog>
    );
}



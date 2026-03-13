"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { themeVar } from "@/theme/registry";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import { ShieldAlert, Timer, RefreshCw } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Doc } from "convex/_generated/dataModel";

interface BansTabProps {
    space: Doc<"spaces">;
    role: "owner" | "admin" | "moderator";
}

export default function BansTab({ space, role }: BansTabProps) {
    const bans = useQuery(api.spaces.moderation.getSpaceBans, { spaceId: space._id });
    const timeouts = useQuery(api.spaces.moderation.getSpaceTimeouts, { spaceId: space._id });

    const unbanUser = useMutation(api.spaces.moderation.unbanUser);
    const timeoutUser = useMutation(api.spaces.moderation.timeoutUser);

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

    const canUnban = role === "owner" || role === "admin" || role === "moderator";

    return (
        <Box sx={{ maxWidth: 1200 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {/* Bans Section */}
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("mutedForeground"), mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                        <ShieldAlert size={16} /> BANNED USERS
                    </Typography>
                    <Stack spacing={1} sx={{ maxHeight: 600, overflowY: "auto", pr: 1 }}>
                        {bans?.map((ban: any) => (
                            <Box key={ban._id} sx={{ p: 2, borderRadius: 2, bgcolor: `color-mix(in oklab, ${themeVar("muted")}, transparent 50%)`, border: `1px solid ${themeVar("destructive")}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <Avatar src={ban.user?.avatarUrl} sx={{ width: 40, height: 40 }} />
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, color: themeVar("foreground") }}>{ban.user?.displayName || "User"}</Typography>
                                        <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), display: "block" }}>Reason: {ban.reason || "No reason specified"}</Typography>
                                        <Typography variant="caption" sx={{ color: themeVar("mutedForeground") }}>Banned on {new Date(ban.createdAt).toLocaleDateString()}</Typography>
                                    </Box>
                                </Box>
                                {canUnban && (
                                    <Tooltip title="Revoke Ban">
                                        <IconButton
                                            size="small"
                                            sx={{ color: themeVar("primary") }}
                                            onClick={() => {
                                                setConfirmDialog({
                                                    open: true,
                                                    title: "Revoke Ban",
                                                    message: `Are you sure you want to unban ${ban.user?.displayName}? They will need an invite to rejoin.`,
                                                    confirmLabel: "Unban User",
                                                    isDanger: false,
                                                    onConfirm: async () => {
                                                        await unbanUser({ spaceId: space._id, userId: ban.userId });
                                                        setConfirmDialog(prev => ({ ...prev, open: false }));
                                                    }
                                                });
                                            }}
                                        >
                                            <RefreshCw size={18} />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        ))}
                        {(!bans || bans.length === 0) && (
                            <Box sx={{ p: 4, textAlign: "center", borderRadius: 2, bgcolor: `color-mix(in oklab, ${themeVar("muted")}, transparent 50%)`, border: `1px dashed ${themeVar("border")}` }}>
                                <Typography variant="body2" sx={{ color: themeVar("mutedForeground") }}>No banned users.</Typography>
                            </Box>
                        )}
                    </Stack>
                </Box>

                {/* Timeouts Section */}
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("mutedForeground"), mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                        <Timer size={16} /> ACTIVE TIMEOUTS
                    </Typography>
                    <Stack spacing={1} sx={{ maxHeight: 600, overflowY: "auto", pr: 1 }}>
                        {timeouts?.map((timeout: any) => (
                            <Box key={timeout._id} sx={{ p: 2, borderRadius: 2, bgcolor: `color-mix(in oklab, ${themeVar("muted")}, transparent 50%)`, border: `1px solid ${themeVar("chart4")}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <Avatar src={timeout.user?.avatarUrl} sx={{ width: 40, height: 40 }} />
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, color: themeVar("foreground") }}>{timeout.user?.displayName || "User"}</Typography>
                                        <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), display: "block" }}>Reason: {timeout.reason || "No reason specified"}</Typography>
                                        <Typography variant="caption" sx={{ color: themeVar("chart4") }}>Expires: {new Date(timeout.expiresAt).toLocaleString()}</Typography>
                                    </Box>
                                </Box>
                                {canUnban && (
                                    <Tooltip title="Remove Timeout">
                                        <IconButton
                                            size="small"
                                            sx={{ color: themeVar("primary") }}
                                            onClick={() => {
                                                setConfirmDialog({
                                                    open: true,
                                                    title: "Remove Timeout",
                                                    message: `Remove timeout for ${timeout.user?.displayName}? They will be able to message immediately.`,
                                                    confirmLabel: "Remove Timeout",
                                                    isDanger: false,
                                                    onConfirm: async () => {
                                                        await timeoutUser({ spaceId: space._id, userId: timeout.userId, timeoutUntil: 0 }); // 0 removes it
                                                        setConfirmDialog(prev => ({ ...prev, open: false }));
                                                    }
                                                });
                                            }}
                                        >
                                            <RefreshCw size={18} />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        ))}
                        {(!timeouts || timeouts.length === 0) && (
                            <Box sx={{ p: 4, textAlign: "center", borderRadius: 2, bgcolor: `color-mix(in oklab, ${themeVar("muted")}, transparent 50%)`, border: `1px dashed ${themeVar("border")}` }}>
                                <Typography variant="body2" sx={{ color: themeVar("mutedForeground") }}>No active timeouts.</Typography>
                            </Box>
                        )}
                    </Stack>
                </Box>
            </Box>

            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))} PaperProps={{ sx: { bgcolor: themeVar("muted"), color: themeVar("foreground"), backgroundImage: "none" } }}>
                <DialogTitle>{confirmDialog.title}</DialogTitle>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))} sx={{ color: themeVar("mutedForeground") }}>Cancel</Button>
                    <Button variant="contained" onClick={confirmDialog.onConfirm} sx={{ bgcolor: confirmDialog.isDanger ? themeVar("destructive") : themeVar("primary"), color: "white" }}>{confirmDialog.confirmLabel}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}



"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import { RefreshCw, Users, Trophy, MailPlus, Copy, CheckCircle2, ShieldAlert } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Doc } from "convex/_generated/dataModel";
import { themeVar } from "@/theme/registry";

interface UserMembersPortalProps {
    space: Doc<"spaces">;
}

export default function UserMembersPortal({ space }: UserMembersPortalProps) {
    const sId = space._id;
    const me = useQuery(api.users.onboarding.queries.me, {});
    const leaderboard = useQuery(api.spaces.invites.getInviteLeaderboard, { spaceId: sId });
    const getOrCreateCode = useMutation(api.spaces.invites.getOrCreateMyInviteCode);
    const regenerateCode = useMutation(api.spaces.invites.regenerateMyInviteCode);

    const [inviteCode, setInviteCode] = React.useState<string | null>(null);
    const [generating, setGenerating] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    const [errorMsg, setErrorMsg] = React.useState("");

    React.useEffect(() => {
        // Automatically fetch or generate code when portal opens
        const fetchCode = async () => {
            if (space.allowInvites === false) return; // don't try if disabled natively
            try {
                setGenerating(true);
                const code = await getOrCreateCode({ spaceId: sId });
                setInviteCode(code);
            } catch (err: any) {
                setErrorMsg(err.message || "Failed to generate invite code. Invites might be disabled.");
            } finally {
                setGenerating(false);
            }
        };
        fetchCode();
    }, [sId, getOrCreateCode, space.allowInvites]);

    const handleRegenerate = async () => {
        try {
            setGenerating(true);
            const code = await regenerateCode({ spaceId: sId });
            setInviteCode(code);
            setErrorMsg("");
        } catch (err: any) {
            setErrorMsg(err.message || "Failed to regenerate invite code.");
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = () => {
        if (!inviteCode) return;

        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Box sx={{ flex: 1, overflowY: "auto", p: 4, bgcolor: themeVar("background") }}>
            <Stack spacing={4} sx={{ maxWidth: 800, margin: "0 auto" }}>
                {/* Header and Private Invite Code */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                        <Typography component="div" sx={{ display: "flex", alignItems: "center", gap: 1, color: themeVar("primary"), fontWeight: 700, mb: 1, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            <Users size={16} /> Members Portal
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: themeVar("foreground") }}>
                            Community Area
                        </Typography>
                        <Typography sx={{ color: themeVar("mutedForeground"), mt: 0.5 }}>
                            Invite your friends and view the community leaderboard.
                        </Typography>
                    </Box>

                    {/* Account Standing */}
                    {me && (me.suspensionStatus || (me.isBanned)) && (
                        <Box sx={{ 
                            p: 2, 
                            borderRadius: 2.5, 
                            bgcolor: `color-mix(in oklab, ${themeVar("destructive")}, transparent 95%)`, 
                            border: `1px solid color-mix(in oklab, ${themeVar("destructive")}, transparent 80%)`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            minWidth: 200
                        }}>
                            <Typography variant="caption" sx={{ color: themeVar("destructive"), fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 10, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ShieldAlert size={14} /> Account Standing
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: themeVar("foreground") }}>
                                {me.isBanned ? 'Permanent Ban' : 
                                 me.suspensionStatus === 'suspensionStage1' ? 'Formal Warning' :
                                 me.suspensionStatus === 'suspensionStageActive' ? 'Active Suspension' :
                                 me.suspensionStatus === 'suspensionStageProfileUpdate' ? 'Profile Review Required' :
                                 'Moderation Action Pending'}
                            </Typography>
                            {me.bannedUntil && (
                                <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontWeight: 700 }}>
                                    Until: {new Date(me.bannedUntil).toLocaleDateString()}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* Invite Code - Top Right */}
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                        <Typography variant="caption" component="div" sx={{ fontWeight: 800, color: themeVar("mutedForeground"), display: "flex", alignItems: "center", gap: 1 }}>
                            <MailPlus size={14} /> YOUR PRIVATE INVITE CODE
                        </Typography>
                        {space.allowInvites === false ? (
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1, p: 1, borderRadius: 1.5, bgcolor: `color-mix(in oklab, ${themeVar("destructive")}, transparent 90%)`, border: `1px solid ${themeVar("destructive")}` }}>
                                <ShieldAlert size={16} style={{ color: themeVar("destructive") }} />
                                <Typography variant="caption" sx={{ color: themeVar("destructive"), fontWeight: 700 }}>Invites Disabled</Typography>
                            </Box>
                        ) : generating ? (
                            <CircularProgress size={20} sx={{ color: themeVar("primary") }} />
                        ) : errorMsg ? (
                            <Typography color="error" variant="caption" sx={{ fontWeight: 600 }}>{errorMsg}</Typography>
                        ) : inviteCode ? (
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                <Button
                                    size="small"
                                    onClick={handleRegenerate}
                                    sx={{
                                        minWidth: 0,
                                        p: 0,
                                        width: 40,
                                        height: 40,
                                        bgcolor: `color-mix(in oklab, ${themeVar("secondary")}, transparent 50%)`,
                                        color: themeVar("mutedForeground"),
                                        borderRadius: 1.5,
                                        border: `1px solid ${themeVar("border")}`,
                                        "&:hover": {
                                            bgcolor: `color-mix(in oklab, ${themeVar("foreground")}, transparent 90%)`,
                                            color: themeVar("foreground")
                                        }
                                    }}
                                    title="Regenerate Code"
                                >
                                    <RefreshCw size={18} />
                                </Button>
                                <Box sx={{
                                    px: 2, py: 1,
                                    bgcolor: `color-mix(in oklab, ${themeVar("primary")}, transparent 80%)`,
                                    borderRadius: 1.5,
                                    border: `1px solid ${themeVar("primary")}`,
                                }}>
                                    <Typography sx={{ fontFamily: "monospace", fontSize: "1.2rem", letterSpacing: "0.1em", fontWeight: 900, color: themeVar("foreground") }}>
                                        {inviteCode}
                                    </Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    onClick={handleCopy}
                                    sx={{
                                        minWidth: 0,
                                        width: 40,
                                        height: 40,
                                        p: 0,
                                        bgcolor: copied ? themeVar("chart2") : `color-mix(in oklab, ${themeVar("secondary")}, transparent 50%)`,
                                        color: "white",
                                        borderRadius: 1.5,
                                        border: `1px solid ${themeVar("border")}`,
                                        "&:hover": {
                                            bgcolor: copied ? themeVar("chart2") : `color-mix(in oklab, ${themeVar("foreground")}, transparent 90%)`,
                                            color: themeVar("foreground")
                                        }
                                    }}
                                >
                                    {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                                </Button>
                            </Box>
                        ) : null}
                    </Box>
                </Box>

                {/* Leaderboard */}
                <Box sx={{ p: 4, borderRadius: 3, bgcolor: `color-mix(in oklab, ${themeVar("secondary")}, transparent 50%)`, border: `1px solid ${themeVar("border")}` }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: themeVar("foreground"), mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                        <Trophy size={20} style={{ color: themeVar("chart3") }} /> Invite Leaderboard
                    </Typography>

                    {leaderboard === undefined ? (
                        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                            <CircularProgress size={24} sx={{ color: themeVar("mutedForeground") }} />
                        </Box>
                    ) : leaderboard.length === 0 ? (
                        <Box sx={{ textAlign: "center", p: 4 }}>
                            <Trophy size={48} style={{ color: "rgba(255,255,255,0.05)", marginBottom: 16 }} />
                            <Typography sx={{ color: themeVar("mutedForeground") }}>No invites yet. Be the first to invite someone!</Typography>
                        </Box>
                    ) : (
                        <Stack spacing={1.5}>
                            {leaderboard.map((entry: any, index: number) => (
                                <Box key={entry.userId} sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: index === 0 ? `color-mix(in oklab, ${themeVar("chart3")}, transparent 90%)` : `color-mix(in oklab, ${themeVar("foreground")}, transparent 95%)`,
                                    border: index === 0 ? `1px solid color-mix(in oklab, ${themeVar("chart3")}, transparent 70%)` : `1px solid ${themeVar("border")}`
                                }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                        <Typography variant="h6" sx={{
                                            fontWeight: 900,
                                            color: index === 0 ? themeVar("chart3") : index === 1 ? "#C0C0C0" : index === 2 ? "#CD7F32" : themeVar("mutedForeground"),
                                            width: 24,
                                            textAlign: "center"
                                        }}>
                                            {index + 1}
                                        </Typography>
                                        <Avatar src={entry.avatarUrl} sx={{ width: 36, height: 36 }} />
                                        <Typography sx={{ fontWeight: 800, color: themeVar("foreground"), fontSize: "1.1rem" }}>
                                            {entry.displayName}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: index === 0 ? themeVar("chart3") : themeVar("primary") }}>
                                            {entry.count}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontWeight: 700, mt: 0.5 }}>
                                            INVITES
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Box>
            </Stack>
        </Box>
    );
}



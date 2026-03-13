"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { ArrowLeft, Clock, ShieldAlert, Eye, EyeOff, CheckCircle2, ChevronLeft, ChevronRight, History, LayoutPanelLeft, UserCircle2, MessageSquare, AlertCircle, Gavel, Shield, Flag, UserX } from "lucide-react";
import ContentTemplate from "../_shared/ContentTemplate";
import { useRouter, useSearchParams } from "next/navigation";
import { UiButton } from "@/components/ui/UiButton";
import { MuiCard } from "@/components/ui/MuiCard";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import { useToast } from "@/hooks/use-toast";
import { themeVar } from "@/theme/registry";

function TargetUserHistory({ targetUserId }: { targetUserId: string }) {
    const history = useQuery(api.hub.overseer.getUserHistory, { userId: targetUserId as any });

    if (history === undefined) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={20} sx={{ color: themeVar("primary") }} />
            </Box>
        );
    }

    if (history.length === 0) {
        return null;
    }

    return (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), display: 'block', mb: 1, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 1, fontSize: 10 }}>
                Prior Action History
            </Typography>
            <Stack spacing={2} sx={{ maxHeight: 200, overflowY: 'auto', pr: 1 }}>
                {history.map((entry, i) => (
                    <Box key={i} sx={{ 
                        p: 1.5, 
                        borderRadius: 1.5, 
                        bgcolor: themeVar("foreground") + '08', 
                        border: `1px solid ${themeVar("foreground")}10`,
                        borderLeft: entry.type === 'action' ? `3px solid ${themeVar("chart4")}` : `3px solid ${themeVar("secondary")}`
                    }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: themeVar("foreground") }}>
                                {entry.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontSize: 10 }}>
                                {new Date(entry.timestamp).toLocaleDateString()}
                            </Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ color: themeVar("foreground"), opacity: 0.7, display: 'block' }}>
                            {entry.reason}
                        </Typography>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontSize: 10 }}>
                                {entry.type === 'action' ? 'Admin Action' : 'Resolved Report'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeVar("primary"), fontWeight: 700, fontSize: 10 }}>
                                By: {entry.moderator}
                            </Typography>
                        </Stack>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
}

export default function CommunityActionsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [viewMode, setViewMode] = useState<"pending" | "history">("pending");
    const feed = useQuery(api.hub.overseer.getReportFeed);
    const historyFeed = useQuery(api.hub.overseer.getResolvedReportFeed);
    const castVote = useMutation(api.hub.overseer.castVote);
    const { toast } = useToast();
    const [acknowledgedImages, setAcknowledgedImages] = useState<Set<string>>(new Set());
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedModActions, setSelectedModActions] = useState<Set<string>>(new Set());
    const [showModActionSelector, setShowModActionSelector] = useState(false);
    const [selectedActionType, setSelectedActionType] = useState<"warn" | "suspend" | "ban" | "none" | "false_report" | "false_report_no_penalty" | "mod_action" | null>(null);
    const [moderationReason, setModerationReason] = useState("");

    const activeFeed = viewMode === "pending" ? feed : historyFeed;
    const currentReport = activeFeed?.[currentIndex];
    const totalReports = activeFeed?.length ?? 0;

    const goBack = () => {
        const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
        sp.set("adminView", "overseerHome");
        router.replace(`/home?${sp.toString()}`);
    };

    const toggleImage = (reportId: string) => {
        const next = new Set(acknowledgedImages);
        if (next.has(reportId)) next.delete(reportId);
        else next.add(reportId);
        setAcknowledgedImages(next);
    };

    const handleVote = async (reportId: any, vote: "warn" | "suspend" | "ban" | "none" | "false_report" | "false_report_no_penalty" | "mod_action", modActions?: string[]) => {
        if (!vote) return;
        
        try {
            await castVote({ reportId, vote, reason: moderationReason || undefined, modActions });
            setShowModActionSelector(false);
            setSelectedActionType(null);
            setModerationReason("");
            setSelectedModActions(new Set());

            // Auto-advance or redirect after a brief delay
            setTimeout(() => {
                if (currentIndex < totalReports - 1) {
                    setCurrentIndex(prev => prev + 1);
                } else {
                    goBack();
                }
            }, 800);
        } catch (err) {
            console.error("Failed to cast vote:", err);
            toast({
                title: "Vote Failed",
                description: "Failed to cast vote. It might have expired or you already voted.",
                variant: "destructive",
            });
        }
    };

    const getTimeLeft = (expiresAt: number) => {
        const diff = expiresAt - Date.now();
        if (diff <= 0) return "Expired";
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${mins}m left`;
    };

    return (
        <ContentTemplate maxWidth="md">
            <Stack spacing={3}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ p: 0.5 }}>
                            <UiButton variant="ghost" size="sm" onClick={goBack}>
                                <ArrowLeft size={16} />
                            </UiButton>
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Community Actions</Typography>
                            <Typography variant="caption" sx={{ color: themeVar("mutedForeground") }}>
                                {viewMode === 'pending' ? 'Review and vote on pending reports.' : 'Review past report outcomes.'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* View Switcher */}
                    <Box sx={{
                        display: 'flex',
                        bgcolor: themeVar("foreground") + '0d',
                        p: 0.5,
                        borderRadius: 2,
                        border: `1px solid ${themeVar("foreground")}10`
                    }}>
                        <UiButton
                            variant={viewMode === 'pending' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => { setViewMode('pending'); setCurrentIndex(0); }}
                            className={`${viewMode === 'pending' ? 'shadow-sm' : ''} rounded-[6px] px-4`}
                            startIcon={<LayoutPanelLeft size={14} />}
                        >
                            Pending
                        </UiButton>
                        <UiButton
                            variant={viewMode === 'history' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => { setViewMode('history'); setCurrentIndex(0); }}
                            className={`${viewMode === 'history' ? 'shadow-sm' : ''} rounded-[6px] px-4`}
                            startIcon={<History size={14} />}
                        >
                            History
                        </UiButton>
                    </Box>
                </Box>

                {/* Report Feed */}
                <Box>
                    {activeFeed === undefined ? (
                        <Typography variant="body2" sx={{ textAlign: 'center', py: 8 }}>Loading reports...</Typography>
                    ) : activeFeed.length === 0 ? (
                        <MuiCard sx={{ textAlign: 'center', py: 8, bgcolor: themeVar("card") }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                                {viewMode === 'pending' ? 'All Clear!' : 'No History'}
                            </Typography>
                            <Typography variant="body1" sx={{ color: themeVar("mutedForeground") }}>
                                {viewMode === 'pending'
                                    ? 'There are no pending reports in the voting window.'
                                    : 'You haven\'t voted on any finalized reports yet.'}
                            </Typography>
                            <UiButton onClick={goBack} className="mt-6">Return</UiButton>
                        </MuiCard>
                    ) : currentReport && (
                        <Stack spacing={2.5}>
                            {/* Navigation Header */}
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    {currentIndex + 1} / {totalReports}
                                </Typography>
                                <Stack direction="row" spacing={0.5}>
                                    <Box sx={{ p: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {currentReport.reporters && currentReport.reporters.length > 0 && (
                                            <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontWeight: 700, mr: 1 }}>
                                                {currentReport.reporters.length > 1 ? `Reporters: ${currentReport.reporters.length}` : 'Reporter Score'}: <span style={{ color: (currentReport.reporters[0]?.socialScore || 10000) < 9000 ? themeVar("chart4") : themeVar("chart3") }}>{currentReport.reporters[0]?.socialScore || 10000}</span>
                                            </Typography>
                                        )}
                                        <UiButton
                                            variant="ghost"
                                            size="sm"
                                            disabled={currentIndex === 0}
                                            onClick={() => setCurrentIndex(prev => prev - 1)}
                                        >
                                            <ChevronLeft size={16} />
                                        </UiButton>
                                    </Box>
                                    <Box sx={{ p: 0.5 }}>
                                        <UiButton
                                            variant="ghost"
                                            size="sm"
                                            disabled={currentIndex === totalReports - 1}
                                            onClick={() => setCurrentIndex(prev => prev + 1)}
                                        >
                                            <ChevronRight size={16} />
                                        </UiButton>
                                    </Box>
                                </Stack>
                            </Stack>

                            <MuiCard sx={{
                                position: 'relative',
                                overflow: 'hidden',
                                border: `1px solid ${themeVar("border")}`,
                                bgcolor: themeVar("card") + '4d',
                                p: 3
                            }}>
                                <Stack spacing={3}>
                                    {/* Subject Overview (Integrated Profile & Media) */}
                                    <Box sx={{
                                        p: 2.5,
                                        borderRadius: 2.5,
                                        bgcolor: themeVar("foreground") + '08',
                                        border: `1px solid ${themeVar("foreground")}14`,
                                        display: 'flex',
                                        gap: 3,
                                        alignItems: 'center',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        {/* Cover Photo Background */}
                                        {currentReport.targetUser?.coverUrl && (
                                            <Box sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                height: '100%',
                                                opacity: 0.15,
                                                zIndex: 0,
                                                filter: acknowledgedImages.has(currentReport._id) ? 'none' : 'blur(10px)'
                                            }}>
                                                <img src={currentReport.targetUser.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </Box>
                                        )}

                                        {/* Unified Media/Profile Image */}
                                        <Box sx={{ position: 'relative', flexShrink: 0, zIndex: 1 }}>
                                            <Box sx={{
                                                width: 100,
                                                height: 100,
                                                borderRadius: currentReport.type === 'user' ? '50%' : 2,
                                                overflow: 'hidden',
                                                bgcolor: themeVar("background"),
                                                border: `2px solid ${themeVar("foreground")}1a`,
                                                position: 'relative',
                                                cursor: (currentReport.type === 'file' || (currentReport.type === 'user' && currentReport.targetUser?.avatarUrl)) ? 'pointer' : 'default',
                                                filter: (currentReport.type === 'file' || currentReport.type === 'user') && !acknowledgedImages.has(currentReport._id) ? 'blur(10px)' : 'none',
                                                transition: 'all 0.3s ease'
                                            }} onClick={() => toggleImage(currentReport._id)}>
                                                {currentReport.type === 'user' ? (
                                                    currentReport.targetUser?.avatarUrl ? (
                                                        <img src={currentReport.targetUser.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <UserCircle2 size={60} style={{ margin: '20px', opacity: 0.1 }} />
                                                    )
                                                ) : currentReport.type === 'file' ? (
                                                    <img src={currentReport.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <MessageSquare size={40} style={{ margin: '30px', opacity: 0.1 }} />
                                                )}

                                                {/* Reveal Overlay */}
                                                {!acknowledgedImages.has(currentReport._id) && (currentReport.type === 'file' || currentReport.type === 'user') && (
                                                    <Box sx={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        bgcolor: themeVar("background") + '66',
                                                        backdropFilter: 'blur(4px)'
                                                    }}>
                                                        <Eye size={24} color="white" />
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>

                                        {/* Subject Identity */}
                                        <Box sx={{ flex: 1, minWidth: 0, zIndex: 1 }}>
                                            <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), textTransform: 'uppercase', fontSize: 10, fontWeight: 800, letterSpacing: 1.5, display: 'block', mb: 0.5 }}>
                                                {currentReport.type === 'user' ? 'Reported Subject' : 'Report Context'}
                                            </Typography>

                                            {currentReport.targetUser ? (
                                                <>
                                                    <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.1 }}>
                                                        {currentReport.targetUser.displayName}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: themeVar("primary"), fontWeight: 700, mt: 0.25 }}>
                                                        @{currentReport.targetUser.username}
                                                    </Typography>
                                                    {currentReport.targetUser.bio && (
                                                        <Typography variant="body2" sx={{ color: themeVar("mutedForeground"), mt: 1, fontStyle: 'italic', fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrientation: 'vertical', overflow: 'hidden' }}>
                                                            "{currentReport.targetUser.bio}"
                                                        </Typography>
                                                    )}
                                                    <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontWeight: 800, textTransform: 'uppercase', fontSize: 10 }}>Social Score</Typography>
                                                        <Box sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: currentReport.targetUser.socialScore < 9000 ? `${themeVar("chart4")}1a` : `${themeVar("chart3")}1a`, color: currentReport.targetUser.socialScore < 9000 ? themeVar("chart4") : themeVar("chart3"), fontWeight: 900, fontSize: 11 }}>
                                                            {currentReport.targetUser.socialScore}
                                                        </Box>
                                                    </Box>
                                                </>
                                            ) : (
                                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                                    {currentReport.type === 'message' ? 'Chat Message' : 'Uploaded File'}
                                                </Typography>
                                            )}
                                        </Box>

                                        {/* Status Badge */}
                                        <Box sx={{ alignSelf: 'flex-start', zIndex: 1 }}>
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.75,
                                                px: 1.5,
                                                py: 0.75,
                                                borderRadius: 1.5,
                                                bgcolor: `${themeVar("chart4")}14`,
                                                color: themeVar("chart4"),
                                                fontSize: 11,
                                                fontWeight: 800,
                                                border: `1px solid ${themeVar("chart4")}26`
                                            }}>
                                                <Clock size={14} />
                                                {getTimeLeft(currentReport.expiresAt)}
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Case File Details */}
                                    <Box sx={{
                                        p: 3,
                                        borderRadius: 2.5,
                                        bgcolor: themeVar("background") + '40',
                                        border: `1px solid ${themeVar("foreground")}0d`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 3
                                    }}>
                                        {/* System Notice */}
                                        {currentReport.type === 'user' && (() => {
                                            const lines = currentReport.content.split('\n');
                                            const source = lines.find(l => l.startsWith('Report Source:'))?.replace('Report Source:', '').trim();
                                            return (
                                                <Box sx={{
                                                    p: 2,
                                                    borderRadius: 1.5,
                                                    bgcolor: `${themeVar("chart1")}0f`,
                                                    border: `1px solid ${themeVar("chart1")}33`,
                                                    display: 'flex',
                                                    gap: 2,
                                                    alignItems: 'center'
                                                }}>
                                                    <AlertCircle size={18} style={{ color: themeVar("chart1") }} />
                                                    <Typography variant="body2" sx={{ color: themeVar("chart1"), fontWeight: 700, fontSize: '0.85rem' }}>
                                                        Logged via {source || 'System API'}. Exercise standard review protocol.
                                                    </Typography>
                                                </Box>
                                            );
                                        })()}

                                        <Stack spacing={3}>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), display: 'block', mb: 1, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 1, fontSize: 10 }}>
                                                    Violation Reason
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 800, color: themeVar("foreground"), lineHeight: 1.3 }}>
                                                    {currentReport.type === 'user'
                                                        ? (currentReport.content.split('\n').find(l => l.startsWith('Report Reason:'))?.replace('Report Reason:', '').trim() || currentReport.reason)
                                                        : currentReport.reason}
                                                </Typography>
                                            </Box>

                                            <Box>
                                                <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), display: 'block', mb: 1, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 1, fontSize: 10 }}>
                                                    Evidence / Description
                                                </Typography>
                                                {currentReport.type === 'user' ? (
                                                    <Typography variant="body2" sx={{
                                                        color: themeVar("foreground") + 'b3',
                                                        lineHeight: 1.6,
                                                        bgcolor: themeVar("foreground") + '05',
                                                        p: 2,
                                                        borderRadius: 1.5,
                                                        border: `1px solid ${themeVar("foreground")}08`,
                                                        fontSize: '0.9rem',
                                                        fontStyle: currentReport.content.includes("Reporter's Description:") ? 'normal' : 'italic'
                                                    }}>
                                                        {currentReport.content.split('\n').find(l => l.startsWith("Reporter's Description:"))?.replace("Reporter's Description:", '').trim() || 'No descriptive evidence provided.'}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body1" sx={{ color: themeVar("foreground"), fontStyle: 'italic', bgcolor: themeVar("foreground") + '08', p: 2, borderRadius: 1.5, border: `1px solid ${themeVar("foreground")}08` }}>
                                                        "{currentReport.content}"
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Stack>
                                        
                                        {/* User History */}
                                        {currentReport.targetUser?._id && (
                                            <TargetUserHistory targetUserId={currentReport.targetUser._id} />
                                        )}
                                    </Box>

                                    {/* Action Terminal */}
                                    {viewMode === 'pending' ? (
                                        (currentReport as any).hasVoted ? (
                                            <Box sx={{
                                                p: 3,
                                                borderRadius: 2.5,
                                                bgcolor: `${themeVar("chart3")}0d`,
                                                border: `1px solid ${themeVar("chart3")}26`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                justifyContent: 'center'
                                            }}>
                                                <CheckCircle2 size={20} style={{ color: themeVar("chart3") }} />
                                                <Typography variant="body2" sx={{ fontWeight: 800, color: themeVar("chart3"), textTransform: 'uppercase', letterSpacing: 1 }}>
                                                    Transmission Complete: Vote Stored
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Stack direction="column" spacing={2}>
                                                <Stack direction="row" spacing={1.5}>
                                                    <UiButton
                                                        variant="secondary"
                                                        className={`flex-1 py-6 text-xs font-black uppercase tracking-widest gap-2 transition-all ${selectedActionType === 'ban' ? 'bg-red-500/20 text-red-400 border-red-500/40 text-glow-red shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/30'}`}
                                                        onClick={() => setSelectedActionType(selectedActionType === "ban" ? null : "ban")}
                                                    >
                                                        <UserX size={16} />
                                                        Ban
                                                    </UiButton>
                                                    <UiButton
                                                        variant="secondary"
                                                        className={`flex-1 py-6 text-xs font-black uppercase tracking-widest gap-2 transition-all ${selectedActionType === 'suspend' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40 text-glow-orange shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/30'}`}
                                                        onClick={() => setSelectedActionType(selectedActionType === "suspend" ? null : "suspend")}
                                                    >
                                                        <Clock size={16} />
                                                        Suspend
                                                    </UiButton>
                                                    <UiButton
                                                        variant="secondary"
                                                        className={`flex-1 py-6 text-xs font-black uppercase tracking-widest gap-2 transition-all ${selectedActionType === 'warn' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40 text-glow-yellow shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/30'}`}
                                                        onClick={() => setSelectedActionType(selectedActionType === "warn" ? null : "warn")}
                                                    >
                                                        <ShieldAlert size={16} />
                                                        Warn
                                                    </UiButton>
                                                    <UiButton
                                                        variant="secondary"
                                                        className={`flex-1 py-6 text-xs font-black uppercase tracking-widest gap-2 transition-all ${selectedActionType === 'mod_action' ? 'bg-chart1/20 text-chart1 border-chart1/40 shadow-[0_0_15px_rgba(var(--chart1),0.2)]' : 'bg-chart1/10 text-chart1 hover:bg-chart1/20 border-chart1/30'}`}
                                                        onClick={() => {
                                                            setSelectedActionType(selectedActionType === "mod_action" ? null : "mod_action");
                                                            setShowModActionSelector(selectedActionType !== "mod_action");
                                                        }}
                                                    >
                                                        <Gavel size={16} />
                                                        Mod Action
                                                    </UiButton>
                                                    <UiButton
                                                        variant="secondary"
                                                        className={`flex-1 py-6 text-xs font-black uppercase tracking-widest bg-foreground/5 text-foreground/70 hover:bg-foreground/10 gap-2 border-border/40`}
                                                        onClick={() => handleVote(currentReport._id, "none")}
                                                    >
                                                        <Shield size={16} />
                                                        Dismiss
                                                    </UiButton>
                                                    <UiButton
                                                        variant="secondary"
                                                        className={`flex-1 py-6 text-xs font-black uppercase tracking-widest bg-chart4/10 text-chart4 hover:bg-chart4/20 border-chart4/30 gap-2`}
                                                        onClick={() => handleVote(currentReport._id, "false_report")}
                                                    >
                                                        <Flag size={16} />
                                                        <Stack alignItems="flex-start" sx={{ ml: 1 }}>
                                                            <span>False Report</span>
                                                            <span style={{ fontSize: 9, opacity: 0.6, fontWeight: 500, letterSpacing: 0, marginTop: '-2px', textTransform: 'lowercase' }}>-500 SC to Reporter</span>
                                                        </Stack>
                                                    </UiButton>
                                                    <UiButton
                                                        variant="secondary"
                                                        className={`flex-1 py-6 text-xs font-black uppercase tracking-widest bg-chart4/10 text-chart4 hover:bg-chart4/20 border-chart4/30 gap-2`}
                                                        onClick={() => handleVote(currentReport._id, "false_report_no_penalty")}
                                                    >
                                                        <Flag size={16} />
                                                        <Stack alignItems="flex-start" sx={{ ml: 1 }}>
                                                            <span>False Report</span>
                                                            <span style={{ fontSize: 9, opacity: 0.6, fontWeight: 500, letterSpacing: 0, marginTop: '-2px', textTransform: 'lowercase' }}>0 Impact to Reporter</span>
                                                        </Stack>
                                                    </UiButton>
                                                </Stack>

                                                {(selectedActionType && selectedActionType !== "none" && selectedActionType !== "false_report" && selectedActionType !== "false_report_no_penalty") && (
                                                    <Box sx={{ 
                                                        mt: 1, 
                                                        p: 2, 
                                                        borderRadius: 2, 
                                                        bgcolor: themeVar("foreground") + '05', 
                                                        border: `1px solid ${themeVar("foreground")}0d`,
                                                        animation: 'fade-in 0.2s ease-out'
                                                    }}>
                                                        <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block', letterSpacing: 1 }}>
                                                            Moderation Reason {selectedActionType !== "mod_action" && "(Sent to user)"}
                                                        </Typography>
                                                        <textarea
                                                            value={moderationReason}
                                                            onChange={(e) => setModerationReason(e.target.value)}
                                                            placeholder={`Enter the reason for ${selectedActionType}...`}
                                                            autoFocus
                                                            style={{
                                                                width: '100%',
                                                                background: themeVar("background") + '33',
                                                                border: `1px solid ${themeVar("border")}`,
                                                                borderRadius: '8px',
                                                                padding: '12px',
                                                                color: themeVar("foreground"),
                                                                fontSize: '0.875rem',
                                                                minHeight: '80px',
                                                                outline: 'none',
                                                                resize: 'none'
                                                            }}
                                                        />
                                                        
                                                        {/* Mod Action Selector */}
                                                        {(selectedActionType === "mod_action" && showModActionSelector) && (
                                                            <Box sx={{
                                                                p: 2.5,
                                                                borderRadius: 2,
                                                                bgcolor: `${themeVar("chart1")}0d`,
                                                                border: `1px solid ${themeVar("chart1")}26`,
                                                                mt: 2
                                                            }}>
                                                                <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontWeight: 800, textTransform: 'uppercase', mb: 2, display: 'block', letterSpacing: 1 }}>
                                                                    Select attributes to enforce change:
                                                                </Typography>
                                                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 1.5, mb: 2.5 }}>
                                                                    {[
                                                                        { id: 'displayName', label: 'Display Name' },
                                                                        { id: 'username', label: 'Username' },
                                                                        { id: 'bio', label: 'Bio / About' },
                                                                        { id: 'avatarUrl', label: 'Profile Picture' },
                                                                        { id: 'coverUrl', label: 'Cover Photo' },
                                                                    ].map((attr) => (
                                                                        <Box
                                                                            key={attr.id}
                                                                            onClick={() => {
                                                                                const next = new Set(selectedModActions);
                                                                                if (next.has(attr.id)) next.delete(attr.id);
                                                                                else next.add(attr.id);
                                                                                setSelectedModActions(next);
                                                                            }}
                                                                            sx={{
                                                                                p: 1.5,
                                                                                borderRadius: 1.5,
                                                                                cursor: 'pointer',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: 1.5,
                                                                                bgcolor: selectedModActions.has(attr.id) ? `${themeVar("chart1")}26` : `${themeVar("foreground")}08`,
                                                                                border: '1px solid',
                                                                                borderColor: selectedModActions.has(attr.id) ? `${themeVar("chart1")}4d` : `${themeVar("foreground")}0d`,
                                                                                transition: 'all 0.2s',
                                                                                '&:hover': { bgcolor: selectedModActions.has(attr.id) ? `${themeVar("chart1")}33` : `${themeVar("foreground")}0f` }
                                                                            }}
                                                                        >
                                                                            <Box sx={{
                                                                                width: 16,
                                                                                height: 16,
                                                                                borderRadius: '4px',
                                                                                border: '2px solid',
                                                                                borderColor: selectedModActions.has(attr.id) ? '#38bdf8' : 'rgba(255,255,255,0.2)',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                bgcolor: selectedModActions.has(attr.id) ? '#38bdf8' : 'transparent'
                                                                            }}>
                                                                                {selectedModActions.has(attr.id) && <CheckCircle2 size={12} color="black" strokeWidth={3} />}
                                                                            </Box>
                                                                            <Typography variant="body2" sx={{ fontWeight: 600, color: selectedModActions.has(attr.id) ? themeVar("chart1") : themeVar("mutedForeground") }}>
                                                                                {attr.label}
                                                                            </Typography>
                                                                        </Box>
                                                                    ))}
                                                                </Box>
                                                            </Box>
                                                        )}
                                                        
                                                        <UiButton
                                                            variant="primary"
                                                            disabled={!moderationReason.trim() || (selectedActionType === 'mod_action' && selectedModActions.size === 0)}
                                                            onClick={() => handleVote(currentReport._id, selectedActionType as any, Array.from(selectedModActions))}
                                                            className={`w-full mt-3 py-6 text-xs font-black uppercase tracking-widest transition-all ${
                                                                selectedActionType === 'ban' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-[0_0_20px_rgba(var(--destructive),0.4)]' :
                                                                selectedActionType === 'warn' ? 'bg-chart4 hover:bg-chart4/90 text-black shadow-[0_0_20px_rgba(var(--chart4),0.4)]' :
                                                                selectedActionType === 'suspend' ? 'bg-chart1 hover:bg-chart1/90 text-white shadow-[0_0_20px_rgba(var(--chart1),0.4)]' : ''
                                                            }`}
                                                        >
                                                            Confirm Action
                                                        </UiButton>
                                                    </Box>
                                                )}
                                            </Stack>
                                        )
                                    ) : (() => {
                                        const r = currentReport as any;
                                        return (
                                            <Box sx={{
                                                p: 3,
                                                borderRadius: 2.5,
                                                bgcolor: themeVar("foreground") + '08',
                                                border: `1px solid ${themeVar("foreground")}0f`,
                                            }}>
                                                <Stack spacing={2.5}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <UserCircle2 size={18} style={{ color: themeVar("mutedForeground") }} />
                                                            <Typography variant="body2" sx={{ fontWeight: 800, color: themeVar("mutedForeground"), textTransform: 'uppercase', letterSpacing: 1 }}>
                                                                Verdict: <span style={{ color: themeVar("foreground") }}>{r.myVote}</span>
                                                            </Typography>
                                                        </Box>
                                                        <Chip
                                                            size="small"
                                                            label={r.resolutionAction === 'none' ? 'Dismissed' : r.resolutionAction === 'mod_action' ? 'Profile Enforcement' : r.resolutionAction === 'false_report_no_penalty' ? 'false report' : r.resolutionAction}
                                                            sx={{
                                                                textTransform: 'uppercase',
                                                                fontWeight: 900,
                                                                fontSize: 10,
                                                                letterSpacing: 1,
                                                                px: 1,
                                                                bgcolor: r.resolutionAction === 'none' ? `${themeVar("foreground")}1a` :
                                                                    r.resolutionAction === 'ban' ? `${themeVar("destructive")}26` :
                                                                        r.resolutionAction === 'false_report' || r.resolutionAction === 'false_report_no_penalty' ? `${themeVar("chart4")}26` :
                                                                            r.resolutionAction === 'mod_action' ? `${themeVar("chart1")}26` :
                                                                                `${themeVar("chart2")}26`,
                                                                color: r.resolutionAction === 'none' ? themeVar("mutedForeground") :
                                                                    r.resolutionAction === 'ban' ? themeVar("destructive") :
                                                                        r.resolutionAction === 'false_report' || r.resolutionAction === 'false_report_no_penalty' ? themeVar("chart4") :
                                                                            r.resolutionAction === 'mod_action' ? themeVar("chart1") :
                                                                                themeVar("chart2"),
                                                                border: '1px solid currentColor'
                                                            }}
                                                        />
                                                    </Box>

                                                    <Divider sx={{ borderColor: themeVar("foreground") + '0d' }} />

                                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                                        <AlertCircle size={18} style={{ color: themeVar("primary"), flexShrink: 0, marginTop: 2 }} />
                                                        <Stack spacing={1}>
                                                            <Typography variant="body2" sx={{ color: themeVar("mutedForeground"), fontStyle: 'italic', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                                                {r.resolutionReason}
                                                            </Typography>
                                                            {r.resolutionModActions && r.resolutionModActions.length > 0 && (
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                                                                    {r.resolutionModActions.map((action: string) => (
                                                                        <Chip
                                                                            key={action}
                                                                            label={action}
                                                                            size="small"
                                                                            sx={{
                                                                                fontSize: 9,
                                                                                fontWeight: 800,
                                                                                textTransform: 'uppercase',
                                                                                bgcolor: `${themeVar("chart1")}1a`,
                                                                                color: themeVar("chart1"),
                                                                                border: `1px solid ${themeVar("chart1")}33`
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </Box>
                                                            )}
                                                        </Stack>
                                                    </Box>

                                                    <Typography variant="caption" sx={{ textAlign: 'right', color: themeVar("mutedForeground"), opacity: 0.5, fontSize: 10, fontWeight: 700 }}>
                                                        Finalized {new Date(r.resolutionTimestamp).toLocaleString()}
                                                    </Typography>
                                                </Stack>
                                            </Box>
                                        );
                                    })()}
                                </Stack>
                            </MuiCard>

                            {viewMode === 'pending' && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', opacity: 0.6 }}>
                                    <Clock size={12} />
                                    <Typography variant="caption" sx={{ fontSize: 10 }}>
                                        Reports resolve automatically after the 72h voting window expires.
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    )}
                </Box>
            </Stack>
        </ContentTemplate>
    );
}



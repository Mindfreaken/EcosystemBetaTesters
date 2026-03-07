"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { ArrowLeft, Clock, ShieldAlert, Eye, EyeOff, CheckCircle2, ChevronLeft, ChevronRight, History, LayoutPanelLeft, UserCircle2, MessageSquare, AlertCircle, Gavel, Shield, Flag, UserX } from "lucide-react";
import ContentTemplate from "../../_shared/ContentTemplate";
import { useRouter, useSearchParams } from "next/navigation";
import { UiButton } from "@/components/ui/UiButton";
import { MuiCard } from "@/components/ui/MuiCard";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";

export default function CommunityActionsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [viewMode, setViewMode] = useState<"pending" | "history">("pending");
    const feed = useQuery(api.hub.overseer.getReportFeed);
    const historyFeed = useQuery(api.hub.overseer.getResolvedReportFeed);
    const castVote = useMutation(api.hub.overseer.castVote);
    const [acknowledgedImages, setAcknowledgedImages] = useState<Set<string>>(new Set());
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedModActions, setSelectedModActions] = useState<Set<string>>(new Set());
    const [showModActionSelector, setShowModActionSelector] = useState(false);

    const activeFeed = viewMode === "pending" ? feed : historyFeed;
    const currentReport = activeFeed?.[currentIndex];
    const totalReports = activeFeed?.length ?? 0;

    const goBack = () => {
        const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
        sp.set("ecoHubView", "overseerHome");
        router.replace(`/home?${sp.toString()}`);
    };

    const toggleImage = (reportId: string) => {
        const next = new Set(acknowledgedImages);
        if (next.has(reportId)) next.delete(reportId);
        else next.add(reportId);
        setAcknowledgedImages(next);
    };

    const handleVote = async (reportId: any, vote: "suspend" | "ban" | "none" | "false_report" | "mod_action", modActions?: string[]) => {
        try {
            await castVote({ reportId, vote, modActions });
            setShowModActionSelector(false);
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
            alert("Failed to cast vote. It might have expired or you already voted.");
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
                            <Typography variant="caption" sx={{ color: 'var(--textSecondary)' }}>
                                {viewMode === 'pending' ? 'Review and vote on pending reports.' : 'Review past report outcomes.'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* View Switcher */}
                    <Box sx={{
                        display: 'flex',
                        bgcolor: 'rgba(255,255,255,0.05)',
                        p: 0.5,
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.05)'
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
                        <MuiCard sx={{ textAlign: 'center', py: 8, bgcolor: 'var(--card)' }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                                {viewMode === 'pending' ? 'All Clear!' : 'No History'}
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'var(--textSecondary)' }}>
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
                                <Typography variant="caption" sx={{ color: 'var(--textSecondary)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    {currentIndex + 1} / {totalReports}
                                </Typography>
                                <Stack direction="row" spacing={0.5}>
                                    <Box sx={{ p: 0.5 }}>
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
                                border: '1px solid color-mix(in oklab, var(--foreground), transparent 85%)',
                                bgcolor: 'rgba(255,255,255,0.03)',
                                p: 3
                            }}>
                                <Stack spacing={3}>
                                    {/* Subject Overview (Integrated Profile & Media) */}
                                    <Box sx={{
                                        p: 2.5,
                                        borderRadius: 2.5,
                                        bgcolor: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.08)',
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
                                                bgcolor: '#050505',
                                                border: '2px solid rgba(255,255,255,0.1)',
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
                                                        bgcolor: 'rgba(0,0,0,0.4)',
                                                        backdropFilter: 'blur(4px)'
                                                    }}>
                                                        <Eye size={24} color="white" />
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>

                                        {/* Subject Identity */}
                                        <Box sx={{ flex: 1, minWidth: 0, zIndex: 1 }}>
                                            <Typography variant="caption" sx={{ color: 'var(--textSecondary)', textTransform: 'uppercase', fontSize: 10, fontWeight: 800, letterSpacing: 1.5, display: 'block', mb: 0.5 }}>
                                                {currentReport.type === 'user' ? 'Reported Subject' : 'Report Context'}
                                            </Typography>

                                            {currentReport.targetUser ? (
                                                <>
                                                    <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.1 }}>
                                                        {currentReport.targetUser.displayName}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: 'var(--primary)', fontWeight: 700, mt: 0.25 }}>
                                                        @{currentReport.targetUser.username}
                                                    </Typography>
                                                    {currentReport.targetUser.bio && (
                                                        <Typography variant="body2" sx={{ color: 'var(--textSecondary)', mt: 1, fontStyle: 'italic', fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrientation: 'vertical', overflow: 'hidden' }}>
                                                            "{currentReport.targetUser.bio}"
                                                        </Typography>
                                                    )}
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
                                                bgcolor: 'rgba(255, 171, 0, 0.08)',
                                                color: '#ffab00',
                                                fontSize: 11,
                                                fontWeight: 800,
                                                border: '1px solid rgba(255, 171, 0, 0.15)'
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
                                        bgcolor: 'rgba(0,0,0,0.25)',
                                        border: '1px solid rgba(255,255,255,0.05)',
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
                                                    bgcolor: 'rgba(56, 189, 248, 0.06)',
                                                    border: '1px solid rgba(56, 189, 248, 0.2)',
                                                    display: 'flex',
                                                    gap: 2,
                                                    alignItems: 'center'
                                                }}>
                                                    <AlertCircle size={18} color="#38bdf8" />
                                                    <Typography variant="body2" sx={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem' }}>
                                                        Logged via {source || 'System API'}. Exercise standard review protocol.
                                                    </Typography>
                                                </Box>
                                            );
                                        })()}

                                        <Stack spacing={3}>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: 'var(--textSecondary)', display: 'block', mb: 1, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 1, fontSize: 10 }}>
                                                    Violation Reason
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--textPrimary)', lineHeight: 1.3 }}>
                                                    {currentReport.type === 'user'
                                                        ? (currentReport.content.split('\n').find(l => l.startsWith('Report Reason:'))?.replace('Report Reason:', '').trim() || currentReport.reason)
                                                        : currentReport.reason}
                                                </Typography>
                                            </Box>

                                            <Box>
                                                <Typography variant="caption" sx={{ color: 'var(--textSecondary)', display: 'block', mb: 1, textTransform: 'uppercase', fontWeight: 900, letterSpacing: 1, fontSize: 10 }}>
                                                    Evidence / Description
                                                </Typography>
                                                {currentReport.type === 'user' ? (
                                                    <Typography variant="body2" sx={{
                                                        color: 'rgba(255,255,255,0.7)',
                                                        lineHeight: 1.6,
                                                        bgcolor: 'rgba(255,255,255,0.02)',
                                                        p: 2,
                                                        borderRadius: 1.5,
                                                        border: '1px solid rgba(255,255,255,0.03)',
                                                        fontSize: '0.9rem',
                                                        fontStyle: currentReport.content.includes("Reporter's Description:") ? 'normal' : 'italic'
                                                    }}>
                                                        {currentReport.content.split('\n').find(l => l.startsWith("Reporter's Description:"))?.replace("Reporter's Description:", '').trim() || 'No descriptive evidence provided.'}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body1" sx={{ color: 'var(--textPrimary)', fontStyle: 'italic', bgcolor: 'rgba(255,255,255,0.03)', p: 2, borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.03)' }}>
                                                        "{currentReport.content}"
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Stack>
                                    </Box>

                                    {/* Action Terminal */}
                                    {viewMode === 'pending' ? (
                                        (currentReport as any).hasVoted ? (
                                            <Box sx={{
                                                p: 3,
                                                borderRadius: 2.5,
                                                bgcolor: 'rgba(74, 222, 128, 0.05)',
                                                border: '1px solid rgba(74, 222, 128, 0.15)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                justifyContent: 'center'
                                            }}>
                                                <CheckCircle2 size={20} color="#4ade80" />
                                                <Typography variant="body2" sx={{ fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 1 }}>
                                                    Transmission Complete: Vote Stored
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Stack direction="column" spacing={2}>
                                                <Stack direction="row" spacing={1.5}>
                                                    <UiButton
                                                        variant="secondary"
                                                        className="flex-1 py-6 text-xs font-black uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/30 gap-2"
                                                        onClick={() => handleVote(currentReport._id, "ban")}
                                                    >
                                                        <UserX size={16} />
                                                        Ban
                                                    </UiButton>
                                                    <UiButton
                                                        variant="secondary"
                                                        className="flex-1 py-6 text-xs font-black uppercase tracking-widest bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/30 gap-2"
                                                        onClick={() => handleVote(currentReport._id, "suspend")}
                                                    >
                                                        <Clock size={16} />
                                                        Suspend
                                                    </UiButton>
                                                    <UiButton
                                                        variant="secondary"
                                                        className={`flex-1 py-6 text-xs font-black uppercase tracking-widest gap-2 transition-all ${showModActionSelector ? 'bg-primary/20 text-primary border-primary/40' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/30'}`}
                                                        onClick={() => setShowModActionSelector(!showModActionSelector)}
                                                    >
                                                        <Gavel size={16} />
                                                        Mod Action
                                                    </UiButton>
                                                    <UiButton
                                                        variant="secondary"
                                                        className="flex-1 py-6 text-xs font-black uppercase tracking-widest bg-white/5 text-white/70 hover:bg-white/10 gap-2"
                                                        onClick={() => handleVote(currentReport._id, "none")}
                                                    >
                                                        <Shield size={16} />
                                                        Dismiss
                                                    </UiButton>
                                                    <UiButton
                                                        variant="secondary"
                                                        className="flex-1 py-6 text-xs font-black uppercase tracking-widest bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/30 gap-2"
                                                        onClick={() => handleVote(currentReport._id, "false_report")}
                                                    >
                                                        <Flag size={16} />
                                                        False Report
                                                    </UiButton>
                                                </Stack>

                                                {/* Mod Action Selector */}
                                                {showModActionSelector && (
                                                    <Box sx={{
                                                        p: 2.5,
                                                        borderRadius: 2,
                                                        bgcolor: 'rgba(56, 189, 248, 0.05)',
                                                        border: '1px solid rgba(56, 189, 248, 0.15)',
                                                        animation: 'slideDown 0.2s ease-out'
                                                    }}>
                                                        <Typography variant="caption" sx={{ color: 'var(--textSecondary)', fontWeight: 800, textTransform: 'uppercase', mb: 2, display: 'block', letterSpacing: 1 }}>
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
                                                                        bgcolor: selectedModActions.has(attr.id) ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                                                                        border: '1px solid',
                                                                        borderColor: selectedModActions.has(attr.id) ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255,255,255,0.05)',
                                                                        transition: 'all 0.2s',
                                                                        '&:hover': { bgcolor: selectedModActions.has(attr.id) ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.06)' }
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
                                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: selectedModActions.has(attr.id) ? '#38bdf8' : 'var(--textSecondary)' }}>
                                                                        {attr.label}
                                                                    </Typography>
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                        <UiButton
                                                            disabled={selectedModActions.size === 0}
                                                            className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest hover:bg-primary/90"
                                                            onClick={() => handleVote(currentReport._id, "mod_action", Array.from(selectedModActions))}
                                                        >
                                                            Submit Enforcement Vote
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
                                                bgcolor: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                            }}>
                                                <Stack spacing={2.5}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <UserCircle2 size={18} color="var(--textSecondary)" />
                                                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'var(--textSecondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
                                                                Verdict: <span style={{ color: 'var(--textPrimary)' }}>{r.myVote}</span>
                                                            </Typography>
                                                        </Box>
                                                        <Chip
                                                            size="small"
                                                            label={r.resolutionAction === 'none' ? 'Dismissed' : r.resolutionAction === 'mod_action' ? 'Profile Enforcement' : r.resolutionAction}
                                                            sx={{
                                                                textTransform: 'uppercase',
                                                                fontWeight: 900,
                                                                fontSize: 10,
                                                                letterSpacing: 1,
                                                                px: 1,
                                                                bgcolor: r.resolutionAction === 'none' ? 'rgba(148, 163, 184, 0.1)' :
                                                                    r.resolutionAction === 'ban' ? 'rgba(239, 68, 68, 0.15)' :
                                                                        r.resolutionAction === 'false_report' ? 'rgba(234, 179, 8, 0.15)' :
                                                                            r.resolutionAction === 'mod_action' ? 'rgba(56, 189, 248, 0.15)' :
                                                                                'rgba(249, 115, 22, 0.15)',
                                                                color: r.resolutionAction === 'none' ? '#94a3b8' :
                                                                    r.resolutionAction === 'ban' ? '#ef4444' :
                                                                        r.resolutionAction === 'false_report' ? '#eab308' :
                                                                            r.resolutionAction === 'mod_action' ? '#38bdf8' :
                                                                                '#f97316',
                                                                border: '1px solid currentColor'
                                                            }}
                                                        />
                                                    </Box>

                                                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

                                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                                        <AlertCircle size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
                                                        <Stack spacing={1}>
                                                            <Typography variant="body2" sx={{ color: 'var(--textSecondary)', fontStyle: 'italic', fontSize: '0.9rem', lineHeight: 1.5 }}>
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
                                                                                bgcolor: 'rgba(56, 189, 248, 0.1)',
                                                                                color: '#38bdf8',
                                                                                border: '1px solid rgba(56, 189, 248, 0.2)'
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </Box>
                                                            )}
                                                        </Stack>
                                                    </Box>

                                                    <Typography variant="caption" sx={{ textAlign: 'right', color: 'var(--textSecondary)', opacity: 0.5, fontSize: 10, fontWeight: 700 }}>
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

"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { ArrowRight, Shield, Lock } from "lucide-react";
import ContentTemplate from "../_shared/ContentTemplate";
import { useRouter, useSearchParams } from "next/navigation";
import { UiButton } from "@/components/ui/UiButton";
import { MuiCard } from "@/components/ui/MuiCard";

export default function OverseerHomeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isOverseer = useQuery(api.hub.overseer.isOverseer);

    if (isOverseer === undefined) return null;

    if (!isOverseer) {
        return (
            <ContentTemplate maxWidth="md">
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    textAlign: 'center',
                    gap: 2
                }}>
                    <Box sx={{ p: 3, borderRadius: '50%', bgcolor: 'color-mix(in oklab, var(--error), transparent 90%)', color: 'var(--error)' }}>
                        <Lock size={48} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>Restricted Access</Typography>
                    <Typography variant="body1" sx={{ color: 'var(--muted-foreground)', maxWidth: 400 }}>
                        The Overseer Hub is reserved for community moderators. If you believe you should have access, please contact support.
                    </Typography>
                    <UiButton onClick={() => {
                        const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
                        sp.delete("adminView");
                        router.replace(`/home?${sp.toString()}`);
                    }}>Return to Hub</UiButton>
                </Box>
            </ContentTemplate>
        );
    }

    return (
        <ContentTemplate maxWidth="lg">
            <Stack spacing={3}>
                {/* Header */}
                <Box sx={{
                    p: 3,
                    borderRadius: 2,
                    background: "linear-gradient(135deg, color-mix(in oklab, var(--primary), transparent 85%) 0%, transparent 100%)",
                    border: "1px solid color-mix(in oklab, var(--foreground), transparent 90%)",
                }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Shield size={32} color="var(--primary)" />
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>Overseer Dashboard</Typography>
                            <Typography variant="body2" sx={{ color: "var(--muted-foreground)" }}>
                                Manage community reports, earn points, and help maintain a safe environment.
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                {/* Actions Grid */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: 2,
                }}>
                    <MuiCard variant="interactive" onClick={() => {
                        const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
                        sp.set("adminView", "communityActions");
                        router.replace(`/home?${sp.toString()}`);
                    }}>
                        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>Community Actions</Typography>
                                <Typography variant="body2" sx={{ color: 'var(--muted-foreground)' }}>View pending reports</Typography>
                            </Box>
                            <ArrowRight size={20} />
                        </Stack>
                    </MuiCard>
                </Box>
            </Stack>
        </ContentTemplate>
    );
}



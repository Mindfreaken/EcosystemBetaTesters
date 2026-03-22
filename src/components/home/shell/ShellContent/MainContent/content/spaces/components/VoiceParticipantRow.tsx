"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import { MicOff, Headphones } from "lucide-react";
import { useIsSpeaking } from "@livekit/components-react";
import ParticipantContextMenu from "./ParticipantContextMenu";

import { Id } from "convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";

interface VoiceParticipantRowProps {
    p: any;
    participants: any[];
    spaceId: Id<"spaces">;
}

const SpeakingAvatar = ({ lkParticipant, avatarUrl, displayName, isStreaming, topRoleColor }: { lkParticipant?: any, avatarUrl?: string, displayName: string, isStreaming: boolean, topRoleColor: string }) => {
    const isSpeaking = useIsSpeaking(lkParticipant);
    
    return (
        <Avatar
            src={avatarUrl}
            alt={displayName}
            sx={{ 
                width: 20, 
                height: 20, 
                border: isSpeaking ? `2px solid #22c55e` : (isStreaming ? `2px solid var(--destructive)` : `1px solid var(--border)`),
                boxShadow: isSpeaking ? `0 0 8px rgba(34, 197, 94, 0.6)` : "none",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: isSpeaking ? "scale(1.05)" : "scale(1)",
                "&::after": isSpeaking ? {
                    content: '""',
                    position: "absolute",
                    inset: -2,
                    borderRadius: "50%",
                    border: "2px solid #22c55e",
                    animation: "speaking-pulse 1.5s infinite"
                } : {}
            }}
        />
    );
};

const SpeakingName = ({ lkParticipant, displayName, topRoleColor }: { lkParticipant?: any, displayName: string, topRoleColor: string }) => {
    const isSpeaking = useIsSpeaking(lkParticipant);
    return (
        <Typography 
            variant="body2" 
            sx={{ 
                fontSize: "0.8rem", 
                fontWeight: 500, 
                color: isSpeaking ? "#22c55e" : (topRoleColor || "var(--foreground)"),
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                transition: "color 0.2s"
            }}
        >
            {displayName}
        </Typography>
    );
};

const VoiceParticipantRow = ({ p, participants, spaceId }: VoiceParticipantRowProps) => {
    const [contextMenu, setContextMenu] = React.useState<{ mouseX: number; mouseY: number } | null>(null);
    const me = useQuery(api.spaces.core.getMe);
    const isSelf = me?._id === p.userId;

    const displayName = p.user?.displayName || p.user?.username || "Unknown";
    
    // Check for real-time LiveKit data if they are in the same room
    const lkParticipant = participants.find(part => part.identity === p.user?.clerkUserId);
    const isMuted = lkParticipant ? !lkParticipant.isMicrophoneEnabled : p.isMuted;
    
    return (
        <Box 
            onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ mouseX: e.clientX, mouseY: e.clientY });
            }}
            sx={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 1, 
                py: 0.5,
                px: 1,
                borderRadius: 1,
                transition: "all 0.2s ease",
                cursor: "default",
                "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }
            }}
        >
            <style>{`
                @keyframes speaking-pulse {
                    0% { transform: scale(1); opacity: 0.7; }
                    100% { transform: scale(1.4); opacity: 0; }
                }
                @keyframes live-pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.6; }
                    100% { opacity: 1; }
                }
            `}</style>
            <Box sx={{ position: "relative", display: "flex" }}>
                {lkParticipant ? (
                    <SpeakingAvatar 
                        lkParticipant={lkParticipant} 
                        avatarUrl={p.user?.avatarUrl} 
                        displayName={displayName} 
                        isStreaming={!!p.isStreaming} 
                        topRoleColor={p.topRole?.color} 
                    />
                ) : (
                    <Avatar
                        src={p.user?.avatarUrl}
                        alt={displayName}
                        sx={{ 
                            width: 20, 
                            height: 20, 
                            border: p.isStreaming ? `2px solid var(--destructive)` : `1px solid var(--border)`,
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                    />
                )
                }
            </Box>
            
            <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 0.5 }}>
                {lkParticipant ? (
                    <SpeakingName 
                        lkParticipant={lkParticipant} 
                        displayName={displayName} 
                        topRoleColor={p.topRole?.color} 
                    />
                ) : (
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            fontSize: "0.8rem", 
                            fontWeight: 500, 
                            color: p.topRole?.color || "var(--foreground)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {displayName}
                    </Typography>
                )}
            </Box>

            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                {isMuted && <MicOff size={11} color="var(--destructive)" />}
                {p.isDeafened && <Headphones size={11} color="var(--destructive)" />}
                {p.isStreaming && (
                    <Box sx={{ 
                        bgcolor: "var(--destructive)", 
                        color: "white", 
                        px: 0.5, 
                        borderRadius: 0.5, 
                        fontSize: "0.55rem", 
                        fontWeight: 900,
                        animation: "live-pulse 2s infinite"
                    }}>
                        LIVE
                    </Box>
                )}
            </Stack>

            <ParticipantContextMenu 
                anchorPosition={contextMenu}
                onClose={() => setContextMenu(null)}
                participant={lkParticipant}
                clerkUserId={p.user?.clerkUserId || p.userId}
                spaceId={spaceId}
                userId={p.userId}
                isSelf={isSelf}
            />
        </Box>
    );
};

export default VoiceParticipantRow;

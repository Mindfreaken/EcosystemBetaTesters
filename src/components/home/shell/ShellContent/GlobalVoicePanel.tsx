import React from "react";
import { Box, Typography, IconButton, Stack } from "@mui/material";
import { Mic, MicOff, Headphones, PhoneOff, Signal } from "lucide-react";
import { useVoiceContext } from "@/context/VoiceContext";
import { useConnectionState, useRoomInfo, useTrackToggle, RoomAudioRenderer, ConnectionStateToast, useLocalParticipant } from "@livekit/components-react";
import { ConnectionState, Track } from "livekit-client";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useShellView } from "./viewContext";

export default function GlobalVoicePanel() {
    const { roomName, channelName, spaceId, token, leaveRoom, isDeafened, toggleDeafen } = useVoiceContext();

    // We only conditionally call LiveKit hooks if we're actually connected 
    // to avoid errors when LiveKitRoom is not in the tree
    if (!roomName || !token) return null;

    return <ActiveVoiceControls leaveRoom={leaveRoom} roomId={roomName} channelName={channelName || ""} spaceId={spaceId} isDeafened={isDeafened} toggleDeafen={toggleDeafen} />;
}

// Rendered inside LiveKitRoom context
function ActiveVoiceControls({ leaveRoom, roomId, channelName, spaceId, isDeafened, toggleDeafen }: { leaveRoom: () => void, roomId: string, channelName: string, spaceId: string | null, isDeafened: boolean, toggleDeafen: () => void }) {
    const connectionState = useConnectionState();
    const { setView, setSelectedSpaceId } = useShellView();
    // LiveKit hook to automatically toggle and read local mic state
    const { buttonProps, enabled } = useTrackToggle({ source: Track.Source.Microphone });
    const isMuted = !enabled;
    const { localParticipant } = useLocalParticipant();
    const isStreaming = localParticipant?.isScreenShareEnabled || localParticipant?.isCameraEnabled;

    const isConnected = connectionState === ConnectionState.Connected;
    const heartbeat = useMutation(api.spaces.voice.heartbeatVoicePresence);
    const leavePresence = useMutation(api.spaces.voice.leaveVoicePresence);

    // Run heartbeat every 10 seconds while connected, and immediately on state changes
    React.useEffect(() => {
        if (!isConnected) return;

        const hb = () => {
            heartbeat({ 
                channelId: roomId as Id<"spaceChannels">,
                isMuted,
                isDeafened,
                isStreaming
            }).catch(() => { });
        };

        hb(); // Run once immediately on connect or state change
        const interval = setInterval(hb, 10000);

        return () => {
            clearInterval(interval);
        };
    }, [isConnected, heartbeat, roomId, isMuted, isDeafened, isStreaming]);

    // Separate effect for cleanup on unmount/disconnect
    React.useEffect(() => {
        return () => {
            if (roomId) {
                leavePresence({ channelId: roomId as Id<"spaceChannels"> }).catch(() => { });
            }
        };
    }, [leavePresence, roomId]);

    const handleNavigate = () => {
        if (spaceId) {
            setSelectedSpaceId(spaceId);
            setView("spaces");
        }
    };

    return (
        <Box
            sx={{
                p: 1.5,
                borderTop: "1px solid var(--border)",
                backgroundColor: "var(--muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
            }}
        >
            {!isDeafened && <RoomAudioRenderer />}
            <ConnectionStateToast />

            <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                tabIndex={0}
                onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        handleNavigate();
                    }
                }}
                sx={{ minWidth: 0, flex: 1, cursor: "pointer", "&:hover": { opacity: 0.8 }, borderRadius: 1 }}
                onClick={handleNavigate}
                aria-label="Go to space"
            >
                <Box sx={{ position: "relative", display: "flex" }}>
                    <Signal size={20} color={isConnected ? "var(--success, #22c55e)" : "var(--muted-foreground)"} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600,
                            color: isConnected ? "var(--success, #22c55e)" : "var(--muted-foreground)",
                            lineHeight: 1.2,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                        }}
                    >
                        Voice Connected
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            color: "var(--muted-foreground)",
                            display: "block",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                        }}
                    >
                        {channelName || "Loading..."}
                    </Typography>
                </Box>
            </Stack>

            <Stack direction="row" spacing={0.5}>
                <IconButton
                    size="small"
                    onClick={buttonProps.onClick}
                    aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                    sx={{
                        color: isMuted ? "var(--destructive)" : "var(--muted-foreground)",
                        "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" }
                    }}
                >
                    {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                </IconButton>

                <IconButton
                    size="small"
                    onClick={() => toggleDeafen()}
                    aria-label={isDeafened ? "Undeafen audio" : "Deafen audio"}
                    sx={{
                        color: isDeafened ? "var(--destructive)" : "var(--muted-foreground)",
                        "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" }
                    }}
                >
                    <Headphones size={18} />
                </IconButton>

                <IconButton
                    size="small"
                    onClick={() => leaveRoom()}
                    aria-label="Leave voice channel"
                    sx={{
                        color: "var(--destructive)",
                        "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.1)" }
                    }}
                >
                    <PhoneOff size={18} />
                </IconButton>
            </Stack>
        </Box>
    );
}



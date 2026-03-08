import React from "react";
import { Box, Typography, IconButton, Stack } from "@mui/material";
import { Mic, MicOff, Headphones, PhoneOff, Signal } from "lucide-react";
import { useVoiceContext } from "@/context/VoiceContext";
import { useConnectionState, useRoomInfo, useTrackToggle, RoomAudioRenderer, ConnectionStateToast } from "@livekit/components-react";
import { ConnectionState, Track } from "livekit-client";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useShellView } from "./viewContext";

export default function GlobalVoicePanel() {
    const { roomName, channelName, spaceId, token, leaveRoom } = useVoiceContext();

    // We only conditionally call LiveKit hooks if we're actually connected 
    // to avoid errors when LiveKitRoom is not in the tree
    if (!roomName || !token) return null;

    return <ActiveVoiceControls leaveRoom={leaveRoom} roomId={roomName} channelName={channelName || ""} spaceId={spaceId} />;
}

// Rendered inside LiveKitRoom context
function ActiveVoiceControls({ leaveRoom, roomId, channelName, spaceId }: { leaveRoom: () => void, roomId: string, channelName: string, spaceId: string | null }) {
    const connectionState = useConnectionState();
    const { setView, setSelectedSpaceId } = useShellView();
    // LiveKit hook to automatically toggle and read local mic state
    const { buttonProps, enabled } = useTrackToggle({ source: Track.Source.Microphone });
    const isMuted = !enabled;

    const isConnected = connectionState === ConnectionState.Connected;
    const heartbeat = useMutation(api.spaces.voice.heartbeatVoicePresence);
    const leavePresence = useMutation(api.spaces.voice.leaveVoicePresence);

    // Run heartbeat every 10 seconds while connected
    React.useEffect(() => {
        if (!isConnected) return;

        const hb = () => {
            heartbeat({ channelId: roomId as Id<"spaceChannels"> }).catch(() => { });
        };

        hb(); // Run once immediately on connect
        const interval = setInterval(hb, 10000);

        return () => {
            clearInterval(interval);
            // Try to explicitly leave when component unmounts
            leavePresence({ channelId: roomId as Id<"spaceChannels"> }).catch(() => { });
        };
    }, [isConnected, heartbeat, leavePresence, roomId]);

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
                borderTop: "1px solid var(--card-border)",
                backgroundColor: "var(--backgroundLight, #0f0f0f)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
            }}
        >
            <RoomAudioRenderer />
            <ConnectionStateToast />

            <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ minWidth: 0, flex: 1, cursor: "pointer", "&:hover": { opacity: 0.8 } }}
                onClick={handleNavigate}
            >
                <Box sx={{ position: "relative", display: "flex" }}>
                    <Signal size={20} color={isConnected ? "var(--success, #22c55e)" : "var(--textSecondary)"} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600,
                            color: isConnected ? "var(--success, #22c55e)" : "var(--textSecondary)",
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
                            color: "var(--textSecondary)",
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
                    sx={{
                        color: isMuted ? "var(--error, #ef4444)" : "var(--textSecondary)",
                        "&:hover": { backgroundColor: "var(--hover, rgba(255,255,255,0.05))" }
                    }}
                >
                    {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                </IconButton>

                {/* Deafen requires manipulating the local tracks/audio outputs, 
            which is complex for a v1, skipping hard deafen logic for now 
            and just building the UI button */}
                <IconButton
                    size="small"
                    sx={{
                        color: "var(--textSecondary)",
                        "&:hover": { backgroundColor: "var(--hover, rgba(255,255,255,0.05))" }
                    }}
                >
                    <Headphones size={18} />
                </IconButton>

                <IconButton
                    size="small"
                    onClick={() => leaveRoom()}
                    sx={{
                        color: "var(--error, #ef4444)",
                        "&:hover": { backgroundColor: "var(--error-alpha, rgba(239, 68, 68, 0.1))" }
                    }}
                >
                    <PhoneOff size={18} />
                </IconButton>
            </Stack>
        </Box>
    );
}

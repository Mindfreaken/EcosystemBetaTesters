"use client";

import React, { useState } from "react";
import "@livekit/components-styles";
import { Box, Typography, Button, CircularProgress, Slider, IconButton } from "@mui/material";
import { useVoiceContext } from "@/context/VoiceContext";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "convex/_generated/api";
import {
    GridLayout,
    ParticipantTile,
    RoomAudioRenderer,
    ControlBar,
    useTracks,
    ConnectionStateToast,
    useConnectionState,
    useIsMuted,
    LayoutContextProvider,
    CarouselLayout,
    FocusLayoutContainer,
    FocusLayout,
    useCreateLayoutContext,
    usePinnedTracks,
    useParticipantInfo,
    useEnsureTrackRef,
    useRoomContext,
} from "@livekit/components-react";
import { Track, ConnectionState, Participant, RemoteAudioTrack, RoomEvent } from "livekit-client";
import { isEqualTrackRef, isTrackReference, TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { PhoneCall, Maximize, Minimize } from "lucide-react";

interface VoiceRoomProps {
    roomId: string;
    roomName: string;
    spaceId: string;
}

export default function VoiceRoom({ roomId, roomName, spaceId }: VoiceRoomProps) {
    const { roomName: connectedRoom, joinRoom, leaveRoom, me, prefetchedTokens, prefetchToken } = useVoiceContext();
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const generateToken = useAction(api.spaces.voiceToken.generate);

    // Check if we are already connected to THIS specific room
    const isConnectedToThisRoom = connectedRoom === roomId;

    // --- TIMEOUT CHECK ---
    const myFullMembership = useQuery(api.spaces.members.getSpaceMember, me?._id ? { spaceId: spaceId as any, userId: me._id } : "skip");
    const isTimedOut = !!(myFullMembership?.timeoutUntil && myFullMembership.timeoutUntil > Date.now());

    const handleJoin = React.useCallback(async () => {
        if (isConnecting) return;

        // Check if we already have a prefetched token for this room
        if (prefetchedTokens[roomId]) {
            joinRoom(roomId, roomName, spaceId, prefetchedTokens[roomId]);
            return;
        }

        // Wait until `me` is loaded
        if (me === undefined) return;

        setIsConnecting(true);
        setError(null);
        try {
            const data = await generateToken({ room: roomId, participantName: me?.displayName || me?.username || 'User' });
            if (data.token) {
                joinRoom(roomId, roomName, spaceId, data.token);
            } else {
                setError("Failed to join");
            }
        } catch (err: any) {
            setError(err.message || "Failed to connect to voice server");
        } finally {
            setIsConnecting(false);
        }
    }, [roomId, roomName, spaceId, joinRoom, isConnecting, me, prefetchedTokens, generateToken]);

    // Track if we've already tried to auto-join this room,
    // so we don't spam if they explicitly disconnect
    const hasAttemptedJoin = React.useRef(false);
    const [hasExplicitlyLeft, setHasExplicitlyLeft] = useState(false);

    // Reset guards if they navigate to a different room
    React.useEffect(() => {
        hasAttemptedJoin.current = false;
        setHasExplicitlyLeft(false);
    }, [roomId]);

    const handleLeave = React.useCallback(() => {
        setHasExplicitlyLeft(true);
        leaveRoom();
    }, [leaveRoom]);

    // Automatically join the room when the user navigates to it, 
    // IF they aren't already connected to it AND haven't explicitly left (AND `me` is loaded)
    React.useEffect(() => {
        if (!isConnectedToThisRoom && !isConnecting && !error && !hasAttemptedJoin.current && !hasExplicitlyLeft && me !== undefined && !isTimedOut) {
            hasAttemptedJoin.current = true;
            handleJoin();
        }
    }, [isConnectedToThisRoom, isConnecting, error, handleJoin, me, isTimedOut, hasExplicitlyLeft]);

    if (!isConnectedToThisRoom) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    gap: 2,
                    p: 3
                }}
            >
                <Typography variant="h5" sx={{ color: "var(--text)" }}>
                    {roomName}
                </Typography>

                {isTimedOut ? (
                    <Box sx={{ textAlign: "center", maxWidth: 400 }}>
                        <Typography variant="body1" sx={{ color: "var(--error, #ef4444)", fontWeight: 700, mb: 1 }}>
                            Access Restricted
                        </Typography>
                        <Typography variant="body2" sx={{ color: "var(--textSecondary)" }}>
                            You are currently timed out in this space and cannot join voice channels until Your timeout expires.
                            {myFullMembership.timeoutUntil && (
                                <Box component="span" sx={{ display: "block", mt: 1, fontWeight: 600 }}>
                                    Expires: {new Date(myFullMembership.timeoutUntil).toLocaleString()}
                                </Box>
                            )}
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <Typography variant="body1" sx={{ color: "var(--textSecondary)", textAlign: "center", maxWidth: 400 }}>
                            Join this voice channel to talk with others in the space.
                        </Typography>

                        {error && (
                            <Typography variant="body2" sx={{ color: "var(--error, #ef4444)" }}>
                                {error}
                            </Typography>
                        )}

                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleJoin}
                            disabled={isConnecting}
                            startIcon={isConnecting ? <CircularProgress size={20} color="inherit" /> : <PhoneCall size={20} />}
                            sx={{
                                mt: 2,
                                backgroundColor: "var(--primary)",
                                color: "var(--background)",
                                fontWeight: 600,
                                borderRadius: 2,
                                textTransform: "none",
                                px: 4,
                                "&:hover": {
                                    backgroundColor: "color-mix(in oklab, var(--primary), black 10%)"
                                }
                            }}
                        >
                            {isConnecting ? "Connecting..." : "Retry Connection"}
                        </Button>
                    </>
                )}
            </Box>
        );
    }

    // If connected, render the LiveKit participant grid!
    // Note: We do NOT need <LiveKitRoom> here because it is rendering globally in our layout.
    // The hooks and components from @livekit/components-react will automatically find it.
    return <ActiveRoom roomName={roomName} onLeave={handleLeave} />;
}

/**
 * Overlay control for managing another participant's volume.
 */
function ParticipantVolumeControl({ clerkUserId, participant }: { clerkUserId: string; participant: Participant }) {
    const volumes = useQuery(api.users.settings.getVoiceVolumes);
    const setVoiceVolume = useMutation(api.users.settings.setVoiceVolume);

    // Find the current db volume if it exists, otherwise default to 1.0 (100)
    const storedVolumeRow = volumes?.find(v => v.targetUserId === clerkUserId);
    const volume = storedVolumeRow ? storedVolumeRow.volume : 1.0;

    // We maintain a local state for the slider so it moves smoothly without waiting for backend
    const [localVolume, setLocalVolume] = useState<number>(volume * 100);

    // Sync initial load
    React.useEffect(() => {
        if (volumes) {
            setLocalVolume(volume * 100);
        }
    }, [volume, volumes]);

    // Apply volume directly to the LiveKit Audio Track whenever volume changes!
    React.useEffect(() => {
        if (!participant) return;
        const pub = participant.getTrackPublication(Track.Source.Microphone);
        const audioTrack = pub?.track;
        if (audioTrack && audioTrack.kind === "audio") {
            // LiveKit applies volume on HTMLAudioElement for Remote Audio Tracks
            (audioTrack as RemoteAudioTrack).setVolume(volume);
        }
    }, [participant, volume]);

    const handleVolumeChange = (event: Event, newValue: number | number[]) => {
        setLocalVolume(newValue as number);
    };

    const handleVolumeChangeCommitted = (event: React.SyntheticEvent | Event, newValue: number | number[]) => {
        const val = newValue as number;
        setVoiceVolume({ targetUserId: clerkUserId, volume: val / 100 });
    };

    return (
        <Box
            className="volume-slider-overlay"
            sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                width: 100,
                bgcolor: 'rgba(0,0,0,0.6)',
                px: 2,
                py: 0.5,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                zIndex: 10,
                opacity: 0,
                transition: 'opacity 0.2s ease-in-out',
                '&:hover': {
                    opacity: 1
                }
            }}
            onPointerDown={(e) => e.stopPropagation()} // Prevent triggering tile clicks
            onClick={(e) => e.stopPropagation()}
        >
            <Slider
                size="small"
                value={localVolume}
                onChange={handleVolumeChange}
                onChangeCommitted={handleVolumeChangeCommitted}
                min={0}
                max={100}
                sx={{
                    color: "var(--primary)",
                    "& .MuiSlider-thumb": {
                        width: 12,
                        height: 12,
                        transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                        '&::before': { boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)' },
                    },
                }}
            />
        </Box>
    );
}

/**
 * A custom ParticipantTile that overlays the user's explicit Convex Avatar 
 * if their camera is muted (or missing), instead of the default LiveKit generic silhouette.
 */
const CustomParticipantTile = React.forwardRef<HTMLDivElement, any>(
    ({ trackRef, ...props }, ref) => {
        const trackReference = useEnsureTrackRef(trackRef);
        const participant = trackReference.participant;

        // Ensure identity is fetched reactively from LiveKit's observer in case it arrives late
        const participantInfo = useParticipantInfo({ participant: participant as Participant });
        const clerkUserId = participantInfo?.identity;

        // Evaluate if this specific track tile should show a camera placeholder
        const isCameraTrack = trackReference.source === Track.Source.Camera;

        // Track whether the user explicitly muted the track provided by this tile
        const isTrackMuted = useIsMuted(trackReference);

        // The camera is muted if there is no participant, or if they explicitly disabled their camera
        const isCameraMuted = !participant || isTrackMuted;

        const shouldShowAvatar = isCameraTrack && isCameraMuted;

        // Prevent duplicate tiles: if this is a Camera or Placeholder track, but the user is ScreenSharing, hide this specific tile natively
        const screenShareTracks = useTracks([Track.Source.ScreenShare]);
        const isScreenSharing = screenShareTracks.some(t => t.participant.identity === clerkUserId);
        const isHiddenDuplicate = isCameraTrack && isScreenSharing;

        // Fetch true Convex Avatar (undefined = loading, null = not found)
        const userProfile = useQuery(
            api.users.onboarding.queries.getUserByClerkId,
            clerkUserId ? { clerkUserId } : "skip"
        );

        // We only show volume sliders for OTHER users
        const isLocalUser = participant?.isLocal;

        return (
            <Box
                ref={ref}
                {...props}
                sx={{
                    position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
                    display: isHiddenDuplicate ? 'none' : undefined,
                    '&:hover .volume-slider-overlay': { opacity: 1 }
                }}
            >
                <ParticipantTile trackRef={trackRef} style={{ width: '100%', height: '100%' }} />

                {(!isLocalUser && participant && clerkUserId) && (
                    <ParticipantVolumeControl clerkUserId={clerkUserId} participant={participant} />
                )}

                {shouldShowAvatar && (
                    <Box sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1, // Sit above the invisible placeholder, but underneath LiveKit metadata (which uses z-index: 2+)
                        pointerEvents: 'none', // let clicks pass through to the tile
                    }}>
                        {userProfile === undefined ? (
                            <CircularProgress size={40} sx={{ color: "var(--textSecondary)" }} />
                        ) : userProfile?.avatarUrl ? (
                            <Box
                                component="img"
                                src={userProfile.avatarUrl}
                                sx={{
                                    width: { xs: 80, sm: 100, md: 120 },
                                    height: { xs: 80, sm: 100, md: 120 },
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    boxShadow: '0px 0px 24px rgba(0,0,0,0.5)',
                                    bgcolor: 'var(--card)'
                                }}
                            />
                        ) : (
                            <Box
                                sx={{
                                    width: { xs: 80, sm: 100, md: 120 },
                                    height: { xs: 80, sm: 100, md: 120 },
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--card-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2rem',
                                    fontWeight: 700,
                                    color: 'var(--textSecondary)'
                                }}
                            >
                                {userProfile?.displayName?.charAt(0) || userProfile?.username?.charAt(0) || participant?.name?.charAt(0) || "?"}
                            </Box>
                        )}
                    </Box>
                )}
            </Box>
        );
    }
);
CustomParticipantTile.displayName = "CustomParticipantTile";

function ActiveRoom({ roomName, onLeave }: { roomName: string, onLeave: () => void }) {
    const connectionState = useConnectionState();
    const roomContext = useRoomContext();
    const hasPlayedOwnJoinSound = React.useRef(false);

    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = React.useState(false);

    // Join Sound Logic
    React.useEffect(() => {
        const room = roomContext; // useRoomContext returns the Room object directly
        if (!room) {
            console.debug("[JoinSound] No room object from useRoomContext yet");
            return;
        }

        console.log("[JoinSound] Initializing sound logic for room:", room.name);

        const playJoinSound = (participant?: any) => {
            console.log("[JoinSound] playJoinSound called. Is local participant:", !participant);
            const audio = new Audio('/sounds/join_sound.mp3');
            audio.volume = 0.5;
            audio.play()
                .then(() => console.log("[JoinSound] Audio played successfully"))
                .catch(err => {
                    console.warn("[JoinSound] Audio playback failed (possibly blocked by browser):", err);
                });
        };

        // Play when others join
        const onParticipantConnected = (participant: any) => {
            console.log("[JoinSound] Participant joined:", participant.identity);
            playJoinSound(participant);
        };

        room.on(RoomEvent.ParticipantConnected, onParticipantConnected);

        // Play when WE join for the first time
        if (connectionState === ConnectionState.Connected && !hasPlayedOwnJoinSound.current) {
            console.log("[JoinSound] ConnectionState is Connected, playing own join sound");
            hasPlayedOwnJoinSound.current = true;
            playJoinSound();
        }

        return () => {
            console.debug("[JoinSound] Cleaning up room events for:", room.name);
            room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
        };
    }, [roomContext, connectionState]);

    React.useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement && containerRef.current) {
                await containerRef.current.requestFullscreen();
            } else if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error("Failed to toggle fullscreen", err);
        }
    };

    // Grab all active tracks (camera, screen share, etc)
    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false }
    );

    const layoutContext = useCreateLayoutContext();

    const screenShareTracks = tracks
        .filter(isTrackReference)
        .filter((track) => track.publication.source === Track.Source.ScreenShare);

    const focusTrack = usePinnedTracks(layoutContext)?.[0];
    const carouselTracks = tracks.filter((track) => !isEqualTrackRef(track, focusTrack));

    // Auto-pin screen share
    const lastAutoFocusedScreenShareTrack = React.useRef<TrackReferenceOrPlaceholder | null>(null);

    React.useEffect(() => {
        if (
            screenShareTracks.some((track) => track.publication.isSubscribed) &&
            lastAutoFocusedScreenShareTrack.current === null
        ) {
            layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: screenShareTracks[0] });
            lastAutoFocusedScreenShareTrack.current = screenShareTracks[0];
        } else if (
            lastAutoFocusedScreenShareTrack.current &&
            !screenShareTracks.some(
                (track) =>
                    track.publication.trackSid ===
                    lastAutoFocusedScreenShareTrack.current?.publication?.trackSid,
            )
        ) {
            layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
            lastAutoFocusedScreenShareTrack.current = null;
        }
    }, [screenShareTracks, focusTrack, tracks, layoutContext]);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", position: "relative" }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6" sx={{ color: "var(--text)" }}>{roomName}</Typography>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={onLeave}
                    sx={{
                        borderColor: "var(--error, #ef4444)",
                        color: "var(--error, #ef4444)",
                        textTransform: "none"
                    }}
                >
                    Disconnect
                </Button>
            </Box>

            {/* Main Grid View */}
            <Box ref={containerRef} sx={{ flex: 1, position: "relative", backgroundColor: "#000", overflow: "hidden" }}>

                {/* Fullscreen Toggle */}
                <IconButton
                    onClick={toggleFullscreen}
                    title="Toggle Fullscreen"
                    sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        zIndex: 50,
                        color: 'white',
                        bgcolor: 'rgba(0,0,0,0.5)',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        ...((connectionState === ConnectionState.Connected) && {
                            // Show when hovering the parent box
                            '.MuiBox-root:hover &': { opacity: 1 },
                            // Always show if fullscreen so users can easily exit
                            ...(isFullscreen && { opacity: 1 })
                        })
                    }}
                >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </IconButton>

                {connectionState === ConnectionState.Connecting ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                        <CircularProgress sx={{ color: "var(--primary)" }} />
                        <Typography variant="body2" sx={{ color: "var(--textSecondary)" }}>Connecting to LiveKit...</Typography>
                    </Box>
                ) : (
                    <Box sx={{ height: "100%", position: "relative" }}>
                        <style>{`
                            .lk-participant-placeholder { visibility: hidden !important; }
                            .lk-focus-toggle-button { display: none !important; }
                            .lk-video-conference { width: 100%; height: 100%; display: flex; flex-direction: column; }
                            .lk-video-conference-inner { flex: 1; display: flex; flex-direction: column; min-height: 0; }
                            
                            /* Ensure control bar floats correctly in fullscreen natively */
                            .lk-control-bar { z-index: 10 !important; }
                        `}</style>
                        <LayoutContextProvider value={layoutContext}>
                            <div className="lk-video-conference-inner" style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
                                {!focusTrack ? (
                                    <div className="lk-grid-layout-wrapper" style={{ height: '100%', width: '100%', flex: 1 }}>
                                        <GridLayout tracks={tracks} style={{ height: "100%" }}>
                                            <CustomParticipantTile />
                                        </GridLayout>
                                    </div>
                                ) : (
                                    <div className="lk-focus-layout-wrapper" style={{ height: '100%', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <FocusLayoutContainer style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", flex: 1 }}>
                                            <CarouselLayout tracks={carouselTracks}>
                                                <CustomParticipantTile />
                                            </CarouselLayout>
                                            {focusTrack && (
                                                <Box sx={{ flex: 1, width: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                                                    <CustomParticipantTile trackRef={focusTrack} style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
                                                </Box>
                                            )}
                                        </FocusLayoutContainer>
                                    </div>
                                )}
                            </div>
                        </LayoutContextProvider>
                    </Box>
                )}
            </Box>

            {/* Internal Room Controls overlay */}
            <Box sx={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)" }}>
                {connectionState === ConnectionState.Connected && (
                    <ControlBar controls={{ microphone: true, screenShare: true, camera: true, leave: false }} />
                )}
            </Box>
        </Box>
    );
}

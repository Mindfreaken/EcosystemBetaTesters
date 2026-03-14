"use client";

import React, { useState } from "react";
import { Menu, MenuItem, Box, Typography, Slider, Divider, ListItemIcon, ListItemText, Stack } from "@mui/material";
import { Volume2, User, Shield, Ban, MicOff, Headphones } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Participant, Track, RemoteAudioTrack, ParticipantEvent } from "livekit-client";

interface ParticipantContextMenuProps {
    anchorPosition: { mouseX: number; mouseY: number } | null;
    onClose: () => void;
    participant: Participant | any; // Any because it might be the presence object too
    clerkUserId: string;
}

const ParticipantContextMenu = ({ anchorPosition, onClose, participant, clerkUserId }: ParticipantContextMenuProps) => {
    const volumes = useQuery(api.users.settings.getVoiceVolumes);
    const setVoiceVolume = useMutation(api.users.settings.setVoiceVolume);

    // Find the current db volume if it exists, otherwise default to 1.0 (100)
    const storedVolumeRow = volumes?.find(v => v.targetUserId === clerkUserId);
    const volume = storedVolumeRow ? storedVolumeRow.volume : 1.0;

    // Local volume state
    const [localVolume, setLocalVolume] = useState<number>(volume * 100);

    // Sync initial load
    React.useEffect(() => {
        if (volumes) {
            setLocalVolume(volume * 100);
        }
    }, [volume, volumes]);

    // Apply volume to LiveKit tracks if available
    React.useEffect(() => {
        if (!participant || !participant.audioTrackPublications) return;

        const applyVolumeToTracks = () => {
            const publications = Array.from(participant.audioTrackPublications.values());
            publications.forEach((pub: any) => {
                if (pub.track && pub.track.kind === "audio" && typeof (pub.track as any).setVolume === "function") {
                    (pub.track as RemoteAudioTrack).setVolume(localVolume / 100);
                }
            });
        };

        applyVolumeToTracks();
        
        if (typeof participant.on === 'function') {
            participant.on(ParticipantEvent.TrackSubscribed, applyVolumeToTracks);
            return () => {
                participant.off(ParticipantEvent.TrackSubscribed, applyVolumeToTracks);
            };
        }
    }, [participant, localVolume]);

    const handleVolumeChange = (event: Event, newValue: number | number[]) => {
        setLocalVolume(newValue as number);
    };

    const handleVolumeChangeCommitted = (event: React.SyntheticEvent | Event, newValue: number | number[]) => {
        const val = newValue as number;
        setVoiceVolume({ targetUserId: clerkUserId, volume: val / 100 });
    };

    const open = Boolean(anchorPosition);

    return (
        <Menu
            open={open}
            onClose={onClose}
            anchorReference="anchorPosition"
            anchorPosition={
                anchorPosition !== null
                    ? { top: anchorPosition.mouseY, left: anchorPosition.mouseX }
                    : undefined
            }
            sx={{
                '& .MuiPaper-root': {
                    bgcolor: 'var(--card)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                    boxShadow: '0px 4px 20px rgba(0,0,0,0.5)',
                    minWidth: 200,
                    p: 0.5
                }
            }}
        >
            <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="caption" sx={{ color: 'var(--muted-foreground)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                    User Volume
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                    <Volume2 size={16} color="var(--muted-foreground)" />
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
                            },
                        }}
                    />
                    <Typography variant="caption" sx={{ width: 25, textAlign: 'right', fontWeight: 600 }}>
                        {Math.round(localVolume)}%
                    </Typography>
                </Stack>
            </Box>

            <Divider sx={{ my: 0.5, borderColor: 'var(--border)' }} />

            <MenuItem onClick={onClose} sx={{ gap: 1.5, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 'unset', color: 'var(--foreground)' }}>
                    <User size={18} />
                </ListItemIcon>
                <ListItemText primary="Profile" primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
            </MenuItem>

            <MenuItem onClick={onClose} sx={{ gap: 1.5, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 'unset', color: 'var(--primary)' }}>
                    <Shield size={18} />
                </ListItemIcon>
                <ListItemText primary="Mention" primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
            </MenuItem>

            <Divider sx={{ my: 0.5, borderColor: 'var(--border)' }} />

            <MenuItem onClick={onClose} sx={{ gap: 1.5, py: 1, color: 'var(--error, #ef4444)' }}>
                <ListItemIcon sx={{ minWidth: 'unset', color: 'inherit' }}>
                    <Ban size={18} />
                </ListItemIcon>
                <ListItemText primary="Block" primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
            </MenuItem>
        </Menu>
    );
};

export default ParticipantContextMenu;

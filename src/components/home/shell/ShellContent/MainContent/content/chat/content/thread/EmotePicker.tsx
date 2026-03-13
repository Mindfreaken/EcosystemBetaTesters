"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Popover from "@mui/material/Popover";
import IconButton from "@mui/material/IconButton";
import { Smile, Search } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { themeVar } from "@/theme/registry";
import InputBase from "@mui/material/InputBase";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { EMOJI_CATEGORIES } from "@/constants/emojis";

interface EmotePickerProps {
    onSelect: (emoji: string, isCustom: boolean, url?: string) => void;
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
}

export default function EmotePicker({ onSelect, anchorEl, open, onClose }: EmotePickerProps) {
    const customEmojis = useQuery(api.spaces.emojis.getUserAllCustomEmojis);
    const [search, setSearch] = React.useState("");

    const filteredCustom = React.useMemo(() => {
        if (!customEmojis) return [];
        if (!search.trim()) return customEmojis;
        const s = search.toLowerCase();
        return customEmojis.filter(e => 
            e.name.toLowerCase().includes(s) || 
            e.spaceName?.toLowerCase().includes(s)
        );
    }, [customEmojis, search]);

    const filteredStandard = React.useMemo(() => {
        if (!search.trim()) return EMOJI_CATEGORIES;
        const s = search.toLowerCase();
        return EMOJI_CATEGORIES.map(cat => ({
            ...cat,
            emojis: cat.emojis.filter(e => e.includes(s) || cat.name.toLowerCase().includes(s))
        })).filter(cat => cat.emojis.length > 0);
    }, [search]);

    // Group custom by space
    const groupedCustom = React.useMemo(() => {
        const groups: Record<string, typeof filteredCustom> = {};
        filteredCustom.forEach(e => {
            const key = e.spaceName || "Global";
            if (!groups[key]) groups[key] = [];
            groups[key].push(e);
        });
        return groups;
    }, [filteredCustom]);

    const hasResults = filteredCustom.length > 0 || filteredStandard.some(cat => cat.emojis.length > 0);

    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            PaperProps={{
                sx: {
                    width: 320,
                    height: 400,
                    bgcolor: themeVar("popover"),
                    border: `1px solid ${themeVar("border")}`,
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    overflow: 'hidden'
                }
            }}
        >
            <Box sx={{ p: 1.5, borderBottom: `1px solid ${themeVar("border")}` }}>
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    px: 1, 
                    py: 0.5, 
                    borderRadius: 2, 
                    bgcolor: 'rgba(0,0,0,0.2)',
                    border: `1px solid ${themeVar("border")}`
                }}>
                    <Search size={14} style={{ color: themeVar("mutedForeground") }} />
                    <InputBase
                        placeholder="Search emotes..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        fullWidth
                        sx={{ 
                            fontSize: '0.875rem', 
                            color: themeVar("foreground"),
                            '& input::placeholder': { color: themeVar("mutedForeground"), opacity: 1 }
                        }}
                    />
                </Box>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
                {/* Standard Emojis */}
                {filteredStandard.map((cat) => (
                    <Box key={cat.name} sx={{ mb: 2 }}>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                fontWeight: 800, 
                                color: themeVar("mutedForeground"), 
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                display: 'block',
                                mb: 1,
                                px: 0.5
                            }}
                        >
                            {cat.name}
                        </Typography>
                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(7, 1fr)', 
                            gap: 0.5 
                        }}>
                            {cat.emojis.map((emoji) => (
                                <IconButton
                                    key={emoji}
                                    onClick={() => {
                                        onSelect(emoji, false);
                                        onClose();
                                    }}
                                    sx={{ 
                                        p: 0.5, 
                                        borderRadius: 1.5,
                                        fontSize: '1.25rem',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                                    }}
                                >
                                    {emoji}
                                </IconButton>
                            ))}
                        </Box>
                    </Box>
                ))}

                {/* Custom Emojis */}
                {Object.entries(groupedCustom).map(([spaceName, emojis]) => (
                    <Box key={spaceName} sx={{ mb: 2 }}>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                fontWeight: 800, 
                                color: themeVar("mutedForeground"), 
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                display: 'block',
                                mb: 1,
                                px: 0.5
                            }}
                        >
                            {spaceName}
                        </Typography>
                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(7, 1fr)', 
                            gap: 0.5 
                        }}>
                            {emojis.map((emoji) => (
                                <Tooltip key={emoji._id} title={`:${emoji.name}:`} arrow placement="top">
                                    <IconButton
                                        onClick={() => {
                                            onSelect(emoji.name, true, emoji.url);
                                            onClose();
                                        }}
                                        sx={{ 
                                            p: 0.5, 
                                            borderRadius: 1.5,
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={emoji.url!}
                                            alt={emoji.name}
                                            sx={{ width: 24, height: 24, objectFit: 'contain' }}
                                        />
                                    </IconButton>
                                </Tooltip>
                            ))}
                        </Box>
                    </Box>
                ))}

                {!hasResults && (
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, opacity: 0.5 }}>
                        <Smile size={32} />
                        <Typography variant="body2" sx={{ mt: 1 }}>No emotes found</Typography>
                    </Box>
                )}
            </Box>
        </Popover>
    );
}

"use client";

import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import { X, MapPin, Calendar, Link as LinkIcon, Award } from "lucide-react";
import { themeVar } from "@/theme/registry";
import RoleTag from "./RoleTag";

interface SpaceMemberProfileModalProps {
    open: boolean;
    onClose: () => void;
    user: {
        displayName?: string;
        avatarUrl?: string;
        coverUrl?: string;
        customStatus?: string;
        bio?: string;
        createdAt?: number;
    };
    roles: any[];
    nameColorRole?: any;
    systemRoleKey?: string;
    userSpaces?: any[];
}

export default function SpaceMemberProfileModal({ open, onClose, user, roles, nameColorRole, systemRoleKey, userSpaces = [] }: SpaceMemberProfileModalProps) {
    const accentColor = nameColorRole?.color || themeVar("primary");
    const coverUrl = user.coverUrl || "/covers/default/default_001.png";
    const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Recently";

    const systemRoleLabel = (() => {
        switch (systemRoleKey) {
            case "owner": return "Space Owner";
            case "admin": return "Space Admin";
            case "moderator": return "Space Moderator";
            default: return "Space Member";
        }
    })();

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: "transparent",
                    backgroundImage: "none",
                    boxShadow: "none",
                    overflow: "visible"
                }
            }}
        >
            <DialogContent sx={{ p: 0, overflow: "visible" }}>
                <Box sx={{
                    position: "relative",
                    borderRadius: 6,
                    overflow: "hidden",
                    bgcolor: "color-mix(in oklab, var(--background), transparent 20%)",
                    backdropFilter: "blur(20px)",
                    border: `1px solid color-mix(in oklab, ${accentColor} 30%, var(--border))`,
                    boxShadow: `0 24px 48px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)`,
                }}>
                    {/* Header Banner */}
                    <Box sx={{
                        height: 120,
                        position: "relative",
                        backgroundImage: `linear-gradient(to bottom, transparent, rgba(0,0,0,0.5)), url(${coverUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}>
                        <IconButton 
                            onClick={onClose}
                            sx={{ 
                                position: "absolute", 
                                top: 12, 
                                right: 12, 
                                bgcolor: "rgba(0,0,0,0.3)", 
                                color: "white",
                                backdropFilter: "blur(4px)",
                                "&:hover": { bgcolor: "rgba(0,0,0,0.5)" }
                            }}
                            size="small"
                        >
                            <X size={18} />
                        </IconButton>
                    </Box>

                    {/* Content */}
                    <Box sx={{ px: 3, pb: 4, pt: 0, mt: -6, position: "relative" }}>
                        <Avatar 
                            src={user.avatarUrl}
                            sx={{ 
                                width: 96, 
                                height: 96, 
                                borderRadius: 4, 
                                border: `4px solid color-mix(in oklab, var(--background), transparent 20%)`,
                                boxShadow: "0 8px 16px rgba(0,0,0,0.4)",
                                bgcolor: "var(--muted)",
                                mb: 2
                            }}
                        />

                        <Box sx={{ mb: 3 }}>
                            <Typography 
                                variant="h5" 
                                className={nameColorRole?.style === "gradient" && nameColorRole.gradientConfig?.isAnimated ? "vibrant-gradient-text" : ""}
                                data-text={user.displayName}
                                sx={{ 
                                    fontWeight: 900, 
                                    color: accentColor,
                                    fontSize: "1.5rem",
                                    mb: 0.5,
                                    ...(nameColorRole?.style === "gradient" && nameColorRole.gradientConfig ? {
                                        backgroundImage: `linear-gradient(${nameColorRole.gradientConfig.angle}deg, ${nameColorRole.gradientConfig.color1}, ${nameColorRole.gradientConfig.color2}, ${nameColorRole.gradientConfig.color1}, ${nameColorRole.gradientConfig.color2}, ${nameColorRole.gradientConfig.color1})`,
                                        backgroundSize: "300% auto",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                    } : {})
                                }}
                            >
                                {user.displayName || "Unknown User"}
                            </Typography>
                            <Typography variant="body2" sx={{ color: themeVar("mutedForeground"), fontWeight: 600 }}>
                                {user.customStatus || "No status set"}
                            </Typography>
                        </Box>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {/* Bio Section */}
                            {user.bio && (
                                <Box>
                                    <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, mb: 1, display: "block" }}>
                                        About Me
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeVar("foreground"), opacity: 0.9, lineHeight: 1.6 }}>
                                        {user.bio}
                                    </Typography>
                                </Box>
                            )}

                            {/* Roles Section */}
                            <Box>
                                <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, mb: 1.5, display: "block" }}>
                                    Roles
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                    {roles.map((role) => (
                                        <RoleTag key={role._id} role={role} />
                                    ))}
                                    {roles.length === 0 && (
                                        <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontStyle: "italic" }}>
                                            No roles in this space
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            {/* Spaces Section */}
                            <Box>
                                <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, mb: 1.5, display: "block" }}>
                                    Current Spaces
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                                    {userSpaces.slice(0, 10).map((space) => (
                                        <Box 
                                            key={space._id} 
                                            sx={{ 
                                                display: "flex", 
                                                alignItems: "center", 
                                                gap: 1, 
                                                bgcolor: "rgba(255,255,255,0.05)", 
                                                pr: 1.5, 
                                                borderRadius: 10,
                                                border: "1px solid rgba(255,255,255,0.05)",
                                                transition: "all 0.2s ease",
                                                "&:hover": {
                                                    bgcolor: "rgba(255,255,255,0.1)",
                                                    transform: "translateY(-1px)"
                                                }
                                            }}
                                        >
                                            <Avatar 
                                                src={space.avatarUrl} 
                                                sx={{ width: 24, height: 24, borderRadius: "50%" }}
                                            >
                                                {space.name[0]}
                                            </Avatar>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: themeVar("foreground") }}>
                                                {space.name}
                                            </Typography>
                                        </Box>
                                    ))}
                                    {userSpaces.length === 0 && (
                                        <Typography variant="caption" sx={{ color: themeVar("mutedForeground"), fontStyle: "italic" }}>
                                            Hidden or no public spaces
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            {/* Footer Info */}
                            <Box sx={{ 
                                display: "flex", 
                                gap: 3, 
                                pt: 2, 
                                borderTop: `1px solid rgba(255,255,255,0.05)`,
                                color: themeVar("mutedForeground")
                            }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Calendar size={14} />
                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>Joined {joinDate}</Typography>
                                </Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Award size={14} />
                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{systemRoleLabel}</Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
}

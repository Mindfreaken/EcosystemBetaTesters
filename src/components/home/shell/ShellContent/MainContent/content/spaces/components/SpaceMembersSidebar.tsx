"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { themeVar } from "@/theme/registry";

interface SpaceMembersSidebarProps {
    spaceId: Id<"spaces">;
}

export default function SpaceMembersSidebar({ spaceId }: SpaceMembersSidebarProps) {
    const members = useQuery(api.spaces.members.getSpaceMembers, { spaceId });

    if (members === undefined) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress size={24} sx={{ color: "var(--textSecondary)" }} />
            </Box>
        );
    }

    // Group members by role
    const groups = {
        owner: members.filter(m => m.role === "owner"),
        admin: members.filter(m => m.role === "admin"),
        moderator: members.filter(m => m.role === "moderator"),
        member: members.filter(m => m.role === "member"),
    };

    const renderGroup = (title: string, groupMembers: typeof members) => {
        if (groupMembers.length === 0) return null;
        return (
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="overline"
                    sx={{
                        px: 2,
                        mb: 1,
                        display: "block",
                        color: "var(--textSecondary)",
                        fontWeight: 800,
                        fontSize: 11,
                        letterSpacing: "0.05em",
                    }}
                >
                    {title} — {groupMembers.length}
                </Typography>
                {groupMembers.map((m) => (
                    <Box
                        key={m._id}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            px: 2,
                            py: 1,
                            borderRadius: 1,
                            mx: 1,
                            mb: 0.5,
                            cursor: "pointer",
                            position: "relative",
                            overflow: "hidden",
                            color: "var(--textSecondary)",
                            borderLeft: "3px solid transparent",
                            transition: "all 0.2s ease",
                            backgroundColor: "color-mix(in oklab, var(--card), transparent 92%)",
                            "&:hover": {
                                transform: "translateX(4px) scale(1.01)",
                                backgroundColor: "color-mix(in oklab, var(--primary), transparent 92%)",
                                color: "var(--text)",
                                borderLeftColor: "var(--primary)",
                                boxShadow: "0 4px 8px var(--shadow)",
                            },
                            "&::before": {
                                content: "''",
                                position: "absolute",
                                left: 0,
                                top: 0,
                                width: "100%",
                                height: "100%",
                                background: "linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 100%)",
                                transform: "translateX(-100%)",
                                transition: "transform .3s ease-out",
                            },
                            "&:hover::before": {
                                transform: "translateX(0)",
                            },
                        }}
                    >
                        <Avatar
                            src={m.user?.avatarUrl}
                            sx={{
                                width: 32,
                                height: 32,
                                border: `1px solid var(--card-border)`,
                            }}
                        />
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 600,
                                color: "var(--textLight)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {m.user?.displayName || m.user?.username || "Unknown User"}
                        </Typography>
                    </Box>
                ))}
            </Box>
        );
    };

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>

            <Box sx={{ flex: 1, overflowY: "auto", pb: 4 }}>
                {renderGroup("OWNER", groups.owner)}
                {renderGroup("ADMINS", groups.admin)}
                {renderGroup("MODERATORS", groups.moderator)}
                {renderGroup("MEMBERS", groups.member)}
            </Box>
        </Box>
    );
}

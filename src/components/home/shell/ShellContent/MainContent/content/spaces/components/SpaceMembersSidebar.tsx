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
import RoleTag from "./RoleTag";
import SpaceMemberProfile from "./SpaceMemberProfile";
import { useState } from "react";

interface SpaceMembersSidebarProps {
    spaceId: Id<"spaces">;
}

export default function SpaceMembersSidebar({ spaceId }: SpaceMembersSidebarProps) {
    const members = useQuery(api.spaces.members.getSpaceMembers, { spaceId });
    const roles = useQuery(api.spaces.roles.getSpaceRoles, { spaceId });
    const [profileTarget, setProfileTarget] = useState<Id<"users"> | null>(null);

    if (members === undefined || roles === undefined) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress size={24} sx={{ color: "var(--muted-foreground)" }} />
            </Box>
        );
    }

    // Identify hoisted roles and sort them by order
    const hoistedRoles = roles
        .filter(r => r.isHoisted)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Group members
    const groups: { [key: string]: { title: string, role?: any, members: typeof members } } = {};
    const assignedMemberIds = new Set<string>();

    // First pass: Assign members to hoisted roles in order
    hoistedRoles.forEach(role => {
        const roleMembers = members.filter(m => {
            if (assignedMemberIds.has(m._id)) return false;
            
            // Match if they have the role ID explicitly or if this is their system base role
            const hasExplicit = m.roles?.some((r: any) => r._id === role._id);
            const isMatchSystem = role.isSystem && role.systemKey === m.role;
            
            return hasExplicit || isMatchSystem;
        });

        if (roleMembers.length > 0) {
            groups[role._id] = {
                title: role.name.toUpperCase(),
                role: role,
                members: roleMembers
            };
            roleMembers.forEach(m => assignedMemberIds.add(m._id));
        }
    });

    // Second pass: All remaining members (Online)
    const remainingMembers = members.filter(m => !assignedMemberIds.has(m._id));
    if (remainingMembers.length > 0) {
        groups["online"] = {
            title: "ONLINE",
            members: remainingMembers
        };
    }

    const renderGroup = (groupId: string, groupData: typeof groups[string]) => {
        const { title, role, members: groupMembers } = groupData;
        return (
            <Box sx={{ mb: 3 }} key={groupId}>
                <Typography
                    variant="overline"
                    sx={{
                        px: 2,
                        mb: 1,
                        display: "block",
                        color: "var(--muted-foreground)",
                        fontWeight: 800,
                        fontSize: 11,
                        letterSpacing: "0.05em",
                    }}
                >
                    {title} — {groupMembers.length}
                </Typography>
                {groupMembers.map((m) => {
                    // Find the system role that matches this member's base role
                    const systemRole = roles.find(r => r.isSystem && r.systemKey === m.role);
                    
                    // Find the highest custom role (including non-hoisted) for name coloring
                    const customRoles = m.roles || [];
                    const sortedCustomRoles = [...customRoles].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
                    
                    // The "highest" role is either the top custom role or the system role
                    // Custom roles override system roles if they have a lower order
                    const customRole = sortedCustomRoles[0];
                    const nameColorRole = (customRole && (!systemRole || customRole.order < systemRole.order)) 
                        ? customRole 
                        : systemRole;

                    const nameColor = nameColorRole?.color || themeVar("foreground");
                    const displayName = m.user?.displayName || m.user?.username || "Unknown User";

                    return (
                    <Box
                        key={m._id}
                        onClick={() => setProfileTarget(m.userId)}
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
                            color: "var(--muted-foreground)",
                            borderLeft: "3px solid transparent",
                            transition: "all 0.2s ease",
                            backgroundColor: "color-mix(in oklab, var(--card), transparent 92%)",
                            "&:hover": {
                                transform: "translateX(4px) scale(1.01)",
                                backgroundColor: "color-mix(in oklab, var(--primary), transparent 92%)",
                                color: "var(--foreground)",
                                borderLeftColor: nameColorRole?.color || "var(--primary)",
                                boxShadow: "0 4px 8px var(--shadow)",
                            },
                            "&::before": {
                                content: "''",
                                position: "absolute",
                                left: 0,
                                top: 0,
                                width: "100%",
                                height: "100%",
                                background: `linear-gradient(135deg, rgba(255,255,255,0) 0%, ${nameColorRole?.color ? `color-mix(in oklab, ${nameColorRole.color} 8%, transparent)` : 'rgba(255,255,255,0.08)'} 100%)`,
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
                                border: `1px solid ${nameColorRole?.color || 'var(--border)'}`,
                            }}
                        />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                                variant="body2"
                                className={nameColorRole?.style === "gradient" && nameColorRole.gradientConfig?.isAnimated ? "vibrant-gradient-text" : ""}
                                data-text={displayName}
                                sx={{
                                    fontWeight: 700,
                                    color: nameColor,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    fontSize: "0.85rem",
                                    ...(nameColorRole?.style === "gradient" && nameColorRole.gradientConfig ? {
                                        backgroundImage: `linear-gradient(${nameColorRole.gradientConfig.angle}deg, ${nameColorRole.gradientConfig.color1}, ${nameColorRole.gradientConfig.color2}, ${nameColorRole.gradientConfig.color1}, ${nameColorRole.gradientConfig.color2}, ${nameColorRole.gradientConfig.color1})`,
                                        backgroundSize: "300% auto",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                    } : {})
                                }}
                            >
                                {displayName}
                            </Typography>
                        </Box>
                    </Box>
                )})}
            </Box>
        );
    };

    const orderedGroupIds = [
        ...hoistedRoles.map(r => r._id),
        "online"
    ].filter(id => groups[id]);

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ flex: 1, overflowY: "auto", pb: 4, pt: 2 }}>
                {orderedGroupIds.map(id => renderGroup(id, groups[id]))}
            </Box>
            
            <SpaceMemberProfile
                open={Boolean(profileTarget)}
                onClose={() => setProfileTarget(null)}
                spaceId={spaceId}
                userId={profileTarget!}
            />
        </Box>
    );
}



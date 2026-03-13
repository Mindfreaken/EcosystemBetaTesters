"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import SpaceMemberProfileModal from "./SpaceMemberProfileModal";
import { themeVar } from "@/theme/registry";

interface SpaceMemberProfileProps {
    open: boolean;
    onClose: () => void;
    spaceId: Id<"spaces">;
    userId: Id<"users"> | null;
}

export default function SpaceMemberProfile({ open, onClose, spaceId, userId }: SpaceMemberProfileProps) {
    const member = useQuery(api.spaces.members.getSpaceMember, { spaceId, userId: userId || (null as any) });
    const allRoles = useQuery(api.spaces.roles.getSpaceRoles, { spaceId });
    const userSpaces = useQuery(api.spaces.core.getPublicUserSpaces, { userId: userId || (null as any) });

    if (!member || !allRoles) return null;

    // Find system role
    const systemRole = allRoles.find(r => r.isSystem && r.systemKey === member.role);
    
    // Combine custom roles and system role for display
    const displayRoles = [...(member.roles || [])];
    if (systemRole) {
        displayRoles.push(systemRole);
    }
    
    // Sort roles by order
    const sortedRoles = displayRoles
        .filter((r): r is NonNullable<typeof r> => !!r)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Determine name color role (highest priority)
    const nameColorRole = sortedRoles[0];

    return (
        <SpaceMemberProfileModal
            open={open}
            onClose={onClose}
            user={{
                displayName: member.user?.displayName,
                avatarUrl: member.user?.avatarUrl,
                coverUrl: member.user?.coverUrl,
                customStatus: member.user?.customStatus,
                bio: member.user?.bio,
                createdAt: member.joinedAt, // Use space join date
            }}
            roles={sortedRoles}
            nameColorRole={nameColorRole}
            systemRoleKey={member.role}
            userSpaces={userSpaces || []}
        />
    );
}

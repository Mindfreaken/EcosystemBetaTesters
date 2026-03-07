import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ensureUserActive } from "../auth/helpers";

/**
 * Create a new invite code for a space.
 */
export const createInvite = mutation({
    args: {
        spaceId: v.id("spaces"),
        maxUses: v.optional(v.number()),
        expiresInHours: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const myRole = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!myRole || (myRole.role !== "owner" && myRole.role !== "admin" && myRole.role !== "moderator")) {
            throw new Error("Unauthorized: Only staff can create invites.");
        }

        const now = Date.now();
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();

        const inviteId = await ctx.db.insert("spaceInvites", {
            spaceId: args.spaceId,
            invitedBy: user._id,
            code,
            maxUses: args.maxUses,
            uses: 0,
            expiresAt: args.expiresInHours ? now + args.expiresInHours * 3600000 : undefined,
            isRevoked: false,
            createdAt: now,
        });

        // Log the action
        await ctx.db.insert("spaceAdminActions", {
            spaceId: args.spaceId,
            adminId: user._id,
            actionType: "create_invite",
            details: `Created new invite code: ${code}`,
            timestamp: now,
        });

        return code;
    },
});

/**
 * Revoke an active invite code.
 */
export const revokeInvite = mutation({
    args: {
        spaceId: v.id("spaces"),
        inviteId: v.id("spaceInvites"),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const myRole = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!myRole || (myRole.role !== "owner" && myRole.role !== "admin" && myRole.role !== "moderator")) {
            throw new Error("Unauthorized: Only staff can revoke invites.");
        }

        const invite = await ctx.db.get(args.inviteId);
        if (!invite) throw new Error("Invite not found.");

        await ctx.db.patch(args.inviteId, { isRevoked: true });

        // Log the action
        await ctx.db.insert("spaceAdminActions", {
            spaceId: args.spaceId,
            adminId: user._id,
            actionType: "revoke_invite",
            details: `Revoked invite code: ${invite.code}`,
            timestamp: Date.now(),
        });
    },
});

/**
 * Toggle whether new members can join via invites.
 */
export const toggleInvites = mutation({
    args: {
        spaceId: v.id("spaces"),
        allowInvites: v.boolean(),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const space = await ctx.db.get(args.spaceId);
        if (!space || space.ownerId !== user._id) {
            throw new Error("Unauthorized: Only the owner can toggle invite settings.");
        }

        await ctx.db.patch(args.spaceId, { allowInvites: args.allowInvites });

        // Log the action
        await ctx.db.insert("spaceAdminActions", {
            spaceId: args.spaceId,
            adminId: user._id,
            actionType: "toggle_invites",
            details: `${args.allowInvites ? "Enabled" : "Disabled"} invites for the space.`,
            timestamp: Date.now(),
        });
    },
});

/**
 * Join a space using an invite code.
 */
export const joinSpaceByCode = mutation({
    args: { code: v.string() },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const invite = await ctx.db
            .query("spaceInvites")
            .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
            .unique();

        if (!invite || invite.isRevoked) {
            throw new Error("Invalid or revoked invite code.");
        }

        const space = await ctx.db.get(invite.spaceId);
        if (!space) throw new Error("Space not found.");

        if (space.allowInvites === false) {
            throw new Error("Invites are currently disabled for this space.");
        }

        if (invite.expiresAt && invite.expiresAt < Date.now()) {
            throw new Error("This invite code has expired.");
        }

        if (invite.maxUses && invite.uses >= invite.maxUses) {
            throw new Error("This invite code has reached its maximum usage limit.");
        }

        // Check if user is banned
        const existingBan = await ctx.db
            .query("spaceBans")
            .withIndex("by_space_user", (q) => q.eq("spaceId", invite.spaceId).eq("userId", user._id))
            .unique();
        if (existingBan) {
            throw new Error("You are banned from this space.");
        }

        // Check if already a member
        const existingMember = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", invite.spaceId).eq("userId", user._id))
            .unique();
        if (existingMember) {
            return invite.spaceId;
        }

        // Increment usage
        await ctx.db.patch(invite._id, { uses: invite.uses + 1 });

        // Join space
        await ctx.db.insert("spaceMembers", {
            spaceId: invite.spaceId,
            userId: user._id,
            role: "member",
            joinedAt: Date.now(),
            invitedBy: invite.invitedBy,
        });

        return invite.spaceId;
    },
});

/**
 * Get active invites for a space.
 */
export const getSpaceInvites = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx).catch(() => null);
        if (!user) return [];

        // Check if owner or admin
        const myRole = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!myRole || (myRole.role !== "owner" && myRole.role !== "admin")) {
            return [];
        }

        const invites = await ctx.db
            .query("spaceInvites")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .filter((q) => q.eq(q.field("isRevoked"), false))
            .collect();

        return await Promise.all(invites.map(async i => {
            const creator = await ctx.db.get(i.invitedBy);
            return {
                ...i,
                creatorDisplayName: creator?.displayName || "Unknown",
                creatorAvatarUrl: creator?.avatarUrl
            };
        }));
    },
});

/**
 * Get the invite leaderboard for a space.
 */
export const getInviteLeaderboard = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        const members = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .collect();

        const inviteCounts: Record<string, number> = {};
        for (const member of members) {
            if (member.invitedBy) {
                const inviterId = member.invitedBy.toString();
                inviteCounts[inviterId] = (inviteCounts[inviterId] || 0) + 1;
            }
        }

        const leaderboard = await Promise.all(
            Object.entries(inviteCounts).map(async ([userId, count]) => {
                const user = await ctx.db.get(userId as Id<"users">);
                return {
                    userId,
                    displayName: (user as any)?.displayName || "Unknown",
                    avatarUrl: (user as any)?.avatarUrl,
                    count
                };
            })
        );

        return leaderboard.sort((a, b) => b.count - a.count);
    },
});

/**
 * Get members invited by a specific user in a space.
 */
export const getInvitedMembersByUser = query({
    args: { spaceId: v.id("spaces"), inviterId: v.id("users") },
    handler: async (ctx, args) => {
        const members = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .filter((q) => q.eq(q.field("invitedBy"), args.inviterId))
            .collect();

        return await Promise.all(
            members.map(async (m) => {
                const user = await ctx.db.get(m.userId);
                return {
                    ...m,
                    displayName: user?.displayName || "Unknown",
                    avatarUrl: user?.avatarUrl,
                };
            })
        );
    },
});


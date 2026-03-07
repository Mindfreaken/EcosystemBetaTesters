import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ensureUserActive } from "../auth/helpers";

export const timeoutUser = mutation({
    args: {
        spaceId: v.id("spaces"),
        userId: v.id("users"),
        timeoutUntil: v.number(), // timestamp or 0 to clear
    },
    handler: async (ctx, args) => {
        const adminUser = await ensureUserActive(ctx);
        const adminMembership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", adminUser._id))
            .unique();

        if (!adminMembership || !["owner", "admin", "moderator"].includes(adminMembership.role)) {
            throw new Error("Unauthorized to timeout users.");
        }

        const targetMembership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", args.userId))
            .unique();

        if (!targetMembership) throw new Error("User not found in space.");

        // Hierarchy check
        if (targetMembership.role === "owner") throw new Error("Cannot timeout the owner.");
        if (targetMembership.role === "admin" && adminMembership.role !== "owner") throw new Error("Only owners can timeout admins.");
        if (targetMembership.role === "moderator" && !["owner", "admin"].includes(adminMembership.role)) throw new Error("Only owners or admins can timeout moderators.");

        await ctx.db.patch(targetMembership._id, {
            timeoutUntil: args.timeoutUntil > 0 ? args.timeoutUntil : undefined,
        });

        // Log the action
        const targetUser = await ctx.db.get(args.userId);
        await ctx.db.insert("spaceAdminActions", {
            spaceId: args.spaceId,
            adminId: adminUser._id,
            actionType: "timeout_user",
            details: args.timeoutUntil > 0
                ? `Timed out user ${targetUser?.displayName || "Unknown"} until ${new Date(args.timeoutUntil).toLocaleString()}`
                : `Removed timeout for user ${targetUser?.displayName || "Unknown"}`,
            timestamp: Date.now(),
        });
    },
});

export const banUser = mutation({
    args: {
        spaceId: v.id("spaces"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const adminUser = await ensureUserActive(ctx);
        const adminMembership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", adminUser._id))
            .unique();

        if (!adminMembership || !["owner", "admin", "moderator"].includes(adminMembership.role)) {
            throw new Error("Unauthorized to ban users.");
        }

        const targetMembership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", args.userId))
            .unique();

        if (targetMembership) {
            // Hierarchy check
            if (targetMembership.role === "owner") throw new Error("Cannot ban the owner.");
            if (targetMembership.role === "admin" && adminMembership.role !== "owner") throw new Error("Only owners can ban admins.");
            if (targetMembership.role === "moderator" && !["owner", "admin"].includes(adminMembership.role)) throw new Error("Only owners or admins can ban moderators.");

            // Remove member
            await ctx.db.delete(targetMembership._id);
        }

        // Check if already banned to prevent duplicates
        const existingBan = await ctx.db
            .query("spaceBans")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", args.userId))
            .unique();

        if (!existingBan) {
            await ctx.db.insert("spaceBans", {
                spaceId: args.spaceId,
                userId: args.userId,
                bannedBy: adminUser._id,
                createdAt: Date.now(),
            });

            // Log the action
            const targetUser = await ctx.db.get(args.userId);
            await ctx.db.insert("spaceAdminActions", {
                spaceId: args.spaceId,
                adminId: adminUser._id,
                actionType: "ban_user",
                details: `Banned user ${targetUser?.displayName || "Unknown"} from the space.`,
                timestamp: Date.now(),
            });
        }
    },
});

export const unbanUser = mutation({
    args: {
        spaceId: v.id("spaces"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const adminUser = await ensureUserActive(ctx);
        const adminMembership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", adminUser._id))
            .unique();

        if (!adminMembership || !["owner", "admin", "moderator"].includes(adminMembership.role)) {
            throw new Error("Unauthorized to unban users.");
        }

        const existingBan = await ctx.db
            .query("spaceBans")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", args.userId))
            .unique();

        if (existingBan) {
            await ctx.db.delete(existingBan._id);
        }
    },
});

export const getSpaceBans = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!membership || !["owner", "admin", "moderator"].includes(membership.role)) {
            throw new Error("Unauthorized");
        }

        const bans = await ctx.db
            .query("spaceBans")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .collect();

        return Promise.all(
            bans.map(async (ban) => {
                const bannedUser = await ctx.db.get(ban.userId);
                const bannedBy = await ctx.db.get(ban.bannedBy);
                return {
                    ...ban,
                    user: bannedUser ? { name: bannedUser.displayName, id: bannedUser._id, email: bannedUser.email } : null,
                    bannedBy: bannedBy ? { name: bannedBy.displayName, id: bannedBy._id } : null,
                };
            })
        );
    },
});

export const getSpaceTimeouts = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!membership || !["owner", "admin", "moderator"].includes(membership.role)) {
            throw new Error("Unauthorized");
        }

        const now = Date.now();
        const timedOutMembers = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .filter((q) => q.gt(q.field("timeoutUntil"), now))
            .collect();

        return Promise.all(
            timedOutMembers.map(async (m) => {
                const memberUser = await ctx.db.get(m.userId);
                return {
                    ...m,
                    user: memberUser ? {
                        name: memberUser.displayName,
                        id: memberUser._id,
                        email: memberUser.email,
                        avatarUrl: memberUser.avatarUrl,
                    } : null,
                };
            })
        );
    },
});


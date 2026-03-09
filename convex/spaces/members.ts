import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ensureUserActive } from "../auth/helpers";

/**
 * Get the current user's role in a space.
 */
export const getMyRole = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx).catch(() => null);
        if (!user) return null;

        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        return membership?.role ?? null;
    },
});

/**
 * Get the current user's membership status in a space, including ban and timeout info.
 */
export const getMembershipStatus = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx).catch(() => null);
        if (!user) return { role: null, isBanned: false, isTimedOut: false };

        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        const ban = await ctx.db
            .query("spaceBans")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        const isTimedOut = !!(membership?.timeoutUntil && membership.timeoutUntil > Date.now());

        return {
            role: membership?.role ?? null,
            isBanned: !!ban,
            isTimedOut,
        };
    },
});

/**
 * Get the list of all members for a space.
 */
export const getSpaceMembers = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        const members = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .collect();

        return await Promise.all(
            members.map(async (m) => {
                const user = await ctx.db.get(m.userId);
                return { ...m, user };
            })
        );
    },
});

/**
 * Get a specific member of a space.
 */
export const getSpaceMember = query({
    args: {
        spaceId: v.id("spaces"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", args.userId))
            .unique();
    },
});

/**
 * Get the list of admins for a space.
 */
export const getSpaceAdmins = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        const admins = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .filter((q) => q.or(
                q.eq(q.field("role"), "admin"),
                q.eq(q.field("role"), "owner"),
                q.eq(q.field("role"), "moderator")
            ))
            .collect();

        return await Promise.all(
            admins.map(async (a) => {
                const user = await ctx.db.get(a.userId);
                return { ...a, user };
            })
        );
    },
});

/**
 * Toggle a user's role between admin and member.
 */
export const setMemberRole = mutation({
    args: {
        spaceId: v.id("spaces"),
        userId: v.id("users"),
        role: v.string(), // "admin" | "member"
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const requesterMembership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!requesterMembership) throw new Error("Unauthorized");

        const isOwner = requesterMembership.role === "owner";
        const isAdmin = requesterMembership.role === "admin";

        if (!isOwner && !isAdmin) {
            throw new Error("Unauthorized: Only owners and admins can manage roles.");
        }

        // Admins can only set moderator/member roles
        if (isAdmin && (args.role === "admin" || args.role === "owner")) {
            throw new Error("Unauthorized: Admins cannot promote users to Admin or Owner.");
        }

        const targetMembership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", args.userId))
            .unique();

        if (!targetMembership) {
            throw new Error("User is not a member of this space.");
        }

        if (targetMembership.role === "owner") {
            throw new Error("Cannot change the role of the owner.");
        }

        await ctx.db.patch(targetMembership._id, { role: args.role });

        const targetUser = await ctx.db.get(args.userId);
        const targetName = targetUser?.displayName || args.userId;

        // Log the action
        await ctx.db.insert("spaceAdminActions", {
            spaceId: args.spaceId,
            adminId: user._id,
            actionType: "update_role",
            details: `Changed role of ${targetName} to ${args.role}`,
            timestamp: Date.now(),
        });
    },
});

/**
 * Remove a member from a space.
 */
export const kickMember = mutation({
    args: { spaceId: v.id("spaces"), targetUserId: v.id("users"), reason: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const myRole = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!myRole || (myRole.role !== "owner" && myRole.role !== "admin" && myRole.role !== "moderator")) {
            throw new Error("Unauthorized: Only staff can kick members.");
        }

        const targetMembership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", args.targetUserId))
            .unique();

        if (!targetMembership) throw new Error("Member not found in this space.");
        if (targetMembership.role === "owner") throw new Error("Owner cannot be kicked.");

        // Admin protection
        if (myRole.role === "admin" && targetMembership.role === "admin") {
            throw new Error("Admins cannot kick other admins.");
        }

        // Moderator protection
        if (myRole.role === "moderator" && (targetMembership.role === "admin" || targetMembership.role === "moderator")) {
            throw new Error("Moderators can only kick regular members.");
        }

        await ctx.db.delete(targetMembership._id);

        const targetUser = await ctx.db.get(args.targetUserId);
        const targetName = targetUser?.displayName || args.targetUserId;

        // Log the action
        await ctx.db.insert("spaceAdminActions", {
            spaceId: args.spaceId,
            adminId: user._id,
            actionType: "kick_member",
            details: `Kicked ${targetName}${args.reason ? ` Reason: ${args.reason}` : ""}`,
            timestamp: Date.now(),
        });
    },
});

/**
 * Leave a space.
 */
export const leaveSpace = mutation({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!membership) throw new Error("You are not a member of this space.");
        if (membership.role === "owner") throw new Error("Owners cannot leave. Delete the space or transfer ownership first.");

        await ctx.db.delete(membership._id);
    },
});


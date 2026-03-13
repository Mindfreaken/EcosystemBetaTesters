import { query, mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { isUserBlocked, SUSPENSION_STAGES } from "../lib/permissions_utils";

// Public query - NOT wrapped with status check
export const getMyStatus = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
            .first();

        if (!user) return null;

        // Get latest log to show reason
        const latestLog = await ctx.db
            .query("suspensionLogs")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .order("desc")
            .first();

        return {
            status: user.suspensionStatus,
            bannedUntil: user.bannedUntil,
            isBlocked: isUserBlocked(user),
            reason: latestLog?.reason,
            lastUpdated: latestLog?.createdAt,
        };
    },
});

// Public query to get suspension history - NOT wrapped with status check
export const getMySuspensionHistory = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
            .first();

        if (!user) return [];

        // Get all logs in descending order (newest first)
        const logs = await ctx.db
            .query("suspensionLogs")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .order("desc")
            .collect();

        return logs.map(log => ({
            previousStatus: log.previousStatus,
            newStatus: log.newStatus,
            reason: log.reason,
            createdAt: log.createdAt,
            metadata: log.metadata,
        }));
    },
});

export const submitAppeal = mutation({
    args: {
        reason: v.string(),
        proofLink: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        // Only allow appeal if currently suspended/banned
        if (!isUserBlocked(user)) {
            throw new Error("Account is active, no appeal needed.");
        }

        // Move to APPEAL stage
        const previousStatus = user.suspensionStatus;
        const newStatus = SUSPENSION_STAGES.APPEAL;

        await ctx.db.patch(user._id, {
            suspensionStatus: newStatus,
        });

        // Log the appeal
        await ctx.db.insert("suspensionLogs", {
            userId: user._id,
            previousStatus,
            newStatus,
            reason: "User submitted appeal: " + args.reason,
            updatedBy: user._id, // User did it themselves
            metadata: {
                proofLink: args.proofLink,
                appealText: args.reason,
            },
            createdAt: Date.now(),
        });

        return { success: true };
    },
});

// Admin/System tool to change status
export const setSuspensionStatus = mutation({
    args: {
        targetUserId: v.id("users"),
        newStatus: v.string(), // keyof SUSPENSION_STAGES
        reason: v.string(),
        bannedUntil: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const actor = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
            .first();

        if (!actor || !actor.overseeradmin) {
            throw new Error("Permission denied: Overseer Admin only");
        }

        const targetUser = await ctx.db.get(args.targetUserId);
        if (!targetUser) throw new Error("Target user not found");

        const previousStatus = targetUser.suspensionStatus;

        // Update user
        await ctx.db.patch(args.targetUserId, {
            suspensionStatus: args.newStatus,
            bannedUntil: args.bannedUntil,
        });

        // Log it
        await ctx.db.insert("suspensionLogs", {
            userId: args.targetUserId,
            previousStatus,
            newStatus: args.newStatus,
            reason: args.reason,
            updatedBy: actor._id,
            createdAt: Date.now(),
        });
    },
});

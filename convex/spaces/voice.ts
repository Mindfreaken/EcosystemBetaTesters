import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ensureUserActive } from "../auth/helpers";

/**
 * Handle voice presence heartbeat.
 * Called continuously by the client when connected to a voice channel.
 */
export const heartbeatVoicePresence = mutation({
    args: {
        channelId: v.id("spaceChannels"),
        isMuted: v.optional(v.boolean()),
        isDeafened: v.optional(v.boolean()),
        isStreaming: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { channelId, isMuted, isDeafened, isStreaming } = args;
        const user = await ensureUserActive(ctx);
        const channel = await ctx.db.get(channelId);
        if (!channel) return;

        const now = Date.now();

        // Check if user is timed out
        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", channel.spaceId).eq("userId", user._id))
            .unique();

        if (membership?.timeoutUntil && membership.timeoutUntil > now) {
            throw new Error("You are currently timed out and cannot join voice channels.");
        }

        // Check if existing presence
        const existing = await ctx.db
            .query("spaceVoicePresence")
            .withIndex("by_user_channel", (q) =>
                q.eq("userId", user._id).eq("channelId", args.channelId)
            )
            .unique();

        if (!existing) {
            await ctx.db.insert("spaceVoicePresence", {
                spaceId: channel.spaceId,
                channelId: channelId,
                userId: user._id,
                joinedAt: now,
                lastSeen: now,
                isMuted,
                isDeafened,
                isStreaming,
            });
        } else {
            const elapsedMs = now - existing.lastSeen;
            const elapsedMins = elapsedMs / (1000 * 60);

            await ctx.db.patch(existing._id, { 
                lastSeen: now,
                isMuted,
                isDeafened,
                isStreaming
            });

            // Track analytics
            const day = new Date(now).toISOString().split("T")[0];
            const stats = await ctx.db
                .query("spaceDailyStats")
                .withIndex("by_day", (q) => q.eq("spaceId", channel.spaceId).eq("day", day))
                .unique();

            if (stats) {
                await ctx.db.patch(stats._id, { totalVoiceMinutes: stats.totalVoiceMinutes + elapsedMins });
            } else {
                await ctx.db.insert("spaceDailyStats", {
                    spaceId: channel.spaceId,
                    day,
                    totalMessages: 0,
                    totalVoiceMinutes: elapsedMins,
                });
            }
        }
    },
});

/**
 * Cleanup voice presence (when proactively leaving)
 */
export const leaveVoicePresence = mutation({
    args: {
        channelId: v.id("spaceChannels"),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const existing = await ctx.db
            .query("spaceVoicePresence")
            .withIndex("by_user_channel", (q) =>
                q.eq("userId", user._id).eq("channelId", args.channelId)
            )
            .unique();

        if (existing) {
            await ctx.db.delete(existing._id);
        }
    },
});

/**
 * Get active voice presence for a space
 * Filters out ghost connections older than 30s.
 */
export const getVoicePresence = query({
    args: {
        spaceId: v.id("spaces"),
    },
    handler: async (ctx, args) => {
        const presences = await ctx.db
            .query("spaceVoicePresence")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .collect();

        // Filter out ghosts (> 30s ago)
        const now = Date.now();
        const active = presences.filter(p => now - p.lastSeen < 30000);

        // Fetch their associated user data and roles
        return await Promise.all(
            active.map(async (p) => {
                const user = await ctx.db.get(p.userId);
                
                // Get member roles for this user in this space
                const roleAssociations = await ctx.db
                    .query("spaceMemberRoles")
                    .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", p.userId))
                    .collect();
                
                const roles = (await Promise.all(
                    roleAssociations.map(async (ra) => await ctx.db.get(ra.roleId))
                )).filter((r): r is NonNullable<typeof r> => !!r);

                // Find the highest role (most specific or highest order)
                const sortedRoles = roles.sort((a, b) => (a.order || 0) - (b.order || 0));
                const topRole = sortedRoles[0];

                return {
                    ...p,
                    user: user ? {
                        _id: user._id,
                        clerkUserId: user.clerkUserId,
                        displayName: user.displayName,
                        avatarUrl: user.avatarUrl,
                        username: user.username,
                    } : null,
                    topRole: topRole ? {
                        name: topRole.name,
                        color: topRole.color,
                    } : null
                };
            })
        );
    },
});

/**
 * Consolidate all details needed for jointing a voice room.
 * Reduces round-trips for token generation.
 */
export const getJoinDetails = query({
    args: {
        channelId: v.id("spaceChannels"),
        clerkUserId: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
            .unique();

        if (!user) return { error: "User not found" };

        const channel = await ctx.db.get(args.channelId);
        if (!channel) return { error: "Channel not found" };

        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", channel.spaceId).eq("userId", user._id))
            .unique();

        return {
            user: {
                _id: user._id,
                displayName: user.displayName,
                username: user.username,
            },
            channel: {
                _id: channel._id,
                spaceId: channel.spaceId,
                name: channel.name,
            },
            membership: membership ? {
                _id: membership._id,
                role: membership.role,
                timeoutUntil: membership.timeoutUntil,
            } : null,
        };
    },
});

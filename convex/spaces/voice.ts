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
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const channel = await ctx.db.get(args.channelId);
        if (!channel) return;

        const now = Date.now();

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
                channelId: args.channelId,
                userId: user._id,
                joinedAt: now,
                lastSeen: now,
            });
        } else {
            await ctx.db.patch(existing._id, { lastSeen: now });
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

        // Fetch their associated user data
        return await Promise.all(
            active.map(async (p) => {
                const user = await ctx.db.get(p.userId);
                return {
                    ...p,
                    user: user ? {
                        _id: user._id,
                        displayName: user.displayName,
                        avatarUrl: user.avatarUrl,
                        username: user.username,
                    } : null
                };
            })
        );
    },
});


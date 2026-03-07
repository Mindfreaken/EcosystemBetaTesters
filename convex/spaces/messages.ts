import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ensureUserActive } from "../auth/helpers";
import { SPACE_ASSISTANT_ID } from "./constants";

/**
 * Get messages for a space channel.
 */
export const getChannelMessages = query({
    args: { channelId: v.id("spaceChannels") },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const channel = await ctx.db.get(args.channelId);
        if (!channel) throw new Error("Channel not found.");

        const space = await ctx.db.get(channel.spaceId);
        if (!space) throw new Error("Space not found.");

        // Check if user is a member of the space
        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", channel.spaceId).eq("userId", user._id))
            .unique();

        if (!membership) throw new Error("Unauthorized: You are not a member of this space.");

        const messages = await ctx.db
            .query("spaceChannelMessages")
            .withIndex("by_channel_time", (q) => q.eq("channelId", args.channelId))
            .order("asc")
            .collect();

        // Enrich messages with sender and reactions
        const enriched = await Promise.all(
            messages.map(async (m) => {
                const sender = await ctx.db.get(m.senderId);
                const reactions = await ctx.db
                    .query("spaceChannelMessageReactions")
                    .withIndex("by_message", (q) => q.eq("messageId", m._id))
                    .collect();

                const senderMembership = await ctx.db
                    .query("spaceMembers")
                    .withIndex("by_space_user", (q) => q.eq("spaceId", channel.spaceId).eq("userId", m.senderId))
                    .unique();

                // Override assistant avatar with space logo
                let avatarUrl = sender?.avatarUrl;
                if (sender?.clerkUserId === SPACE_ASSISTANT_ID) {
                    avatarUrl = space.avatarUrl || avatarUrl;
                }

                return {
                    ...m,
                    sender: sender ? {
                        displayName: sender.displayName,
                        username: sender.username,
                        avatarUrl: avatarUrl,
                        timeoutUntil: senderMembership?.timeoutUntil,
                    } : null,
                    reactions: reactions.map(r => ({
                        userId: r.userId,
                        reaction: r.reaction,
                    }))
                };
            })
        );

        return enriched;
    },
});

/**
 * Send a message to a space channel.
 */
export const sendChannelMessage = mutation({
    args: {
        channelId: v.id("spaceChannels"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const channel = await ctx.db.get(args.channelId);
        if (!channel) throw new Error("Channel not found.");

        const space = await ctx.db.get(channel.spaceId);

        // Check membership
        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", channel.spaceId).eq("userId", user._id))
            .unique();

        if (!membership) throw new Error("Unauthorized: You are not a member of this space.");

        if (membership.timeoutUntil && membership.timeoutUntil > Date.now()) {
            throw new Error("You are currently timed out and cannot send messages.");
        }

        if (channel.isReadOnly) {
            const isOwner = membership.role === "owner";
            const isAdmin = membership.role === "admin";
            const isMod = membership.role === "moderator";

            const canPost = isOwner ||
                (isAdmin && (space?.adminCanPostInReadOnly ?? false)) ||
                (isMod && (space?.modCanPostInReadOnly ?? false));

            if (!canPost) {
                throw new Error("Unauthorized: This channel is read-only. Only space staff with permission can send messages here.");
            }
        }

        const now = Date.now();
        const messageId = await ctx.db.insert("spaceChannelMessages", {
            channelId: args.channelId,
            senderId: user._id,
            content: args.content,
            createdAt: now,
        });

        // Track analytics
        const day = new Date(now).toISOString().split("T")[0];
        const stats = await ctx.db
            .query("spaceDailyStats")
            .withIndex("by_day", (q) => q.eq("spaceId", channel.spaceId).eq("day", day))
            .unique();

        if (stats) {
            await ctx.db.patch(stats._id, { totalMessages: stats.totalMessages + 1 });
        } else {
            await ctx.db.insert("spaceDailyStats", {
                spaceId: channel.spaceId,
                day,
                totalMessages: 1,
                totalVoiceMinutes: 0,
            });
        }

        return messageId;
    },
});

/**
 * Delete a channel message.
 */
export const deleteChannelMessage = mutation({
    args: { messageId: v.id("spaceChannelMessages") },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found.");

        const channel = await ctx.db.get(message.channelId);
        if (!channel) throw new Error("Channel not found.");

        // If it's their own message, they can delete it
        if (message.senderId === user._id) {
            await ctx.db.delete(args.messageId);
            return;
        }

        // Otherwise check if they are owner/admin/mod
        const member = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", channel.spaceId).eq("userId", user._id))
            .unique();

        if (!member || !["owner", "admin", "moderator"].includes(member.role)) {
            throw new Error("Unauthorized to delete this message.");
        }

        await ctx.db.delete(args.messageId);
    },
});

/**
 * Toggle a reaction on a channel message.
 */
export const toggleChannelMessageReaction = mutation({
    args: {
        messageId: v.id("spaceChannelMessages"),
        reaction: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found.");

        const channel = await ctx.db.get(message.channelId);
        if (!channel) throw new Error("Channel not found.");

        // Check membership
        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", channel.spaceId).eq("userId", user._id))
            .unique();

        if (!membership) throw new Error("Unauthorized: You are not a member of this space.");

        const existing = await ctx.db
            .query("spaceChannelMessageReactions")
            .withIndex("by_message_user_reaction", (q) =>
                q.eq("messageId", args.messageId)
                    .eq("userId", user._id)
                    .eq("reaction", args.reaction)
            )
            .unique();

        if (existing) {
            await ctx.db.delete(existing._id);
        } else {
            await ctx.db.insert("spaceChannelMessageReactions", {
                messageId: args.messageId,
                userId: user._id,
                reaction: args.reaction,
                createdAt: Date.now(),
            });
        }
    },
});

/**
 * Bulk delete messages from a specific user.
 */
export const bulkDeleteUserMessages = mutation({
    args: {
        spaceId: v.id("spaces"),
        userId: v.id("users"),
        channelId: v.optional(v.id("spaceChannels")),
        limit: v.optional(v.number()), // null or undefined for all
    },
    handler: async (ctx, args) => {
        const adminUser = await ensureUserActive(ctx);
        const adminMembership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", adminUser._id))
            .unique();

        if (!adminMembership || !["owner", "admin", "moderator"].includes(adminMembership.role)) {
            throw new Error("Unauthorized to bulk delete messages.");
        }

        let messagesQuery = ctx.db
            .query("spaceChannelMessages")
            .filter((q) => q.eq(q.field("senderId"), args.userId));

        const messages = await messagesQuery.collect();

        // Filter by channel if provided
        let filtered = messages;
        if (args.channelId) {
            filtered = messages.filter(m => m.channelId === args.channelId);
        }

        // Sort by time descending (most recent first)
        filtered.sort((a, b) => b.createdAt - a.createdAt);

        // Apply limit
        const toDelete = args.limit ? filtered.slice(0, args.limit) : filtered;

        const targetUser = await ctx.db.get(args.userId);
        const channel = args.channelId ? await ctx.db.get(args.channelId) : null;

        for (const msg of toDelete) {
            await ctx.db.delete(msg._id);
        }

        // Log the action
        await ctx.db.insert("spaceAdminActions", {
            spaceId: args.spaceId,
            adminId: adminUser._id,
            actionType: "bulk_delete",
            details: `Bulk deleted ${toDelete.length} messages from user ${targetUser?.displayName || "Unknown"}${channel ? ` in #${channel.name}` : " across the space"}.`,
            timestamp: Date.now(),
        });

        return toDelete.length;
    },
});


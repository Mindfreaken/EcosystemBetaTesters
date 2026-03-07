import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ensureUserActive } from "../auth/helpers";

/**
 * Get all channels for a space.
 */
export const getChannels = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("spaceChannels")
            .withIndex("by_order", (q) => q.eq("spaceId", args.spaceId))
            .collect();
    },
});

/**
 * Get a single channel by ID.
 */
export const getChannel = query({
    args: { channelId: v.id("spaceChannels") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.channelId);
    },
});

/**
 * Get all categories for a space.
 */
export const getCategories = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("spaceCategories")
            .withIndex("by_order", (q) => q.eq("spaceId", args.spaceId))
            .collect();
    },
});

/**
 * Create a new category in a space.
 */
export const createCategory = mutation({
    args: {
        spaceId: v.id("spaces"),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const space = await ctx.db.get(args.spaceId);
        if (!space) throw new Error("Space not found.");

        const myRole = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!myRole) throw new Error("Unauthorized: You are not a member of this space.");

        const isOwner = myRole.role === "owner";
        const isAdmin = myRole.role === "admin";
        const isMod = myRole.role === "moderator";

        const canEdit = isOwner ||
            (isAdmin && (space.adminCanEditChannels ?? true)) ||
            (isMod && (space.modCanEditChannels ?? false));

        if (!canEdit) {
            throw new Error("Unauthorized: You do not have permission to manage categories.");
        }

        // Get count for ordering
        const existingCategories = await ctx.db
            .query("spaceCategories")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .collect();

        const categoryId = await ctx.db.insert("spaceCategories", {
            spaceId: args.spaceId,
            name: args.name,
            order: existingCategories.length,
            createdAt: Date.now(),
        });

        // Log the action
        await ctx.db.insert("spaceAdminActions", {
            spaceId: args.spaceId,
            adminId: user._id,
            actionType: "create_category",
            details: `Created category: ${args.name}`,
            timestamp: Date.now(),
        });

        return categoryId;
    },
});

/**
 * Update a category's metadata.
 */
export const updateCategory = mutation({
    args: {
        categoryId: v.id("spaceCategories"),
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const category = await ctx.db.get(args.categoryId);
        if (!category) throw new Error("Category not found.");

        const space = await ctx.db.get(category.spaceId);
        if (!space) throw new Error("Space not found.");

        const myRole = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", category.spaceId).eq("userId", user._id))
            .unique();

        if (!myRole) throw new Error("Unauthorized: You are not a member of this space.");

        const isOwner = myRole.role === "owner";
        const isAdmin = myRole.role === "admin";
        const isMod = myRole.role === "moderator";

        const canEdit = isOwner ||
            (isAdmin && (space.adminCanEditChannels ?? true)) ||
            (isMod && (space.modCanEditChannels ?? false));

        if (!canEdit) {
            throw new Error("Unauthorized: You do not have permission to manage categories.");
        }

        const patches: any = {};
        if (args.name) patches.name = args.name;

        await ctx.db.patch(args.categoryId, patches);

        // Log the action
        await ctx.db.insert("spaceAdminActions", {
            spaceId: category.spaceId,
            adminId: user._id,
            actionType: "update_category",
            details: `Updated category name.`,
            timestamp: Date.now(),
        });
    },
});

/**
 * Delete a category. Unlinks its channels.
 */
export const deleteCategory = mutation({
    args: { categoryId: v.id("spaceCategories") },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const category = await ctx.db.get(args.categoryId);
        if (!category) throw new Error("Category not found.");

        const space = await ctx.db.get(category.spaceId);
        if (!space) throw new Error("Space not found.");

        const myRole = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", category.spaceId).eq("userId", user._id))
            .unique();

        if (!myRole) throw new Error("Unauthorized: You are not a member of this space.");

        const isOwner = myRole.role === "owner";
        const isAdmin = myRole.role === "admin";
        const isMod = myRole.role === "moderator";

        const canEdit = isOwner ||
            (isAdmin && (space.adminCanEditChannels ?? true)) ||
            (isMod && (space.modCanEditChannels ?? false));

        if (!canEdit) {
            throw new Error("Unauthorized: You do not have permission to manage categories.");
        }

        // Unlink channels associated with this category
        const channels = await ctx.db
            .query("spaceChannels")
            .withIndex("by_space", (q) => q.eq("spaceId", category.spaceId))
            .filter((q) => q.eq(q.field("categoryId"), args.categoryId))
            .collect();

        for (const channel of channels) {
            await ctx.db.patch(channel._id, { categoryId: undefined });
        }

        await ctx.db.delete(args.categoryId);

        // Log the action
        await ctx.db.insert("spaceAdminActions", {
            spaceId: category.spaceId,
            adminId: user._id,
            actionType: "delete_category",
            details: `Deleted category: ${category.name}`,
            timestamp: Date.now(),
        });
    },
});

/**
 * Create a new channel in a space.
 */
export const createChannel = mutation({
    args: {
        spaceId: v.id("spaces"),
        categoryId: v.optional(v.id("spaceCategories")),
        name: v.string(),
        type: v.string(),
        description: v.optional(v.string()),
        isReadOnly: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const space = await ctx.db.get(args.spaceId);
        if (!space) throw new Error("Space not found.");

        const myRole = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!myRole) throw new Error("Unauthorized: You are not a member of this space.");

        const isOwner = myRole.role === "owner";
        const isAdmin = myRole.role === "admin";
        const isMod = myRole.role === "moderator";

        const canEdit = isOwner ||
            (isAdmin && (space.adminCanEditChannels ?? true)) ||
            (isMod && (space.modCanEditChannels ?? false));

        if (!canEdit) {
            throw new Error("Unauthorized: You do not have permission to manage channels.");
        }

        // Get count for ordering
        const existingChannels = await ctx.db
            .query("spaceChannels")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .collect();

        const channelId = await ctx.db.insert("spaceChannels", {
            spaceId: args.spaceId,
            categoryId: args.categoryId,
            name: args.name.toLowerCase().replace(/\s+/g, "-"),
            type: args.type,
            description: args.description,
            isReadOnly: args.isReadOnly,
            channelOrder: existingChannels.length,
            createdAt: Date.now(),
        });

        // Log the action
        await ctx.db.insert("spaceAdminActions", {
            spaceId: args.spaceId,
            adminId: user._id,
            actionType: "create_channel",
            details: `Created channel: #${args.name}`,
            timestamp: Date.now(),
        });

        return channelId;
    },
});

/**
 * Update a channel's metadata.
 */
export const updateChannel = mutation({
    args: {
        channelId: v.id("spaceChannels"),
        categoryId: v.optional(v.optional(v.id("spaceCategories"))),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        isReadOnly: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const channel = await ctx.db.get(args.channelId);
        if (!channel) throw new Error("Channel not found.");

        const space = await ctx.db.get(channel.spaceId);
        if (!space) throw new Error("Space not found.");

        const myRole = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", channel.spaceId).eq("userId", user._id))
            .unique();

        if (!myRole) throw new Error("Unauthorized: You are not a member of this space.");

        const isOwner = myRole.role === "owner";
        const isAdmin = myRole.role === "admin";
        const isMod = myRole.role === "moderator";

        const canEdit = isOwner ||
            (isAdmin && (space.adminCanEditChannels ?? true)) ||
            (isMod && (space.modCanEditChannels ?? false));

        if (!canEdit) {
            throw new Error("Unauthorized: You do not have permission to manage channels.");
        }

        const patches: any = {};
        if (args.name) patches.name = args.name.toLowerCase().replace(/\s+/g, "-");
        if (args.description !== undefined) patches.description = args.description;
        if (args.categoryId !== undefined) patches.categoryId = args.categoryId;
        if (args.isReadOnly !== undefined) patches.isReadOnly = args.isReadOnly;

        await ctx.db.patch(args.channelId, patches);

        // Log the action
        await ctx.db.insert("spaceAdminActions", {
            spaceId: channel.spaceId,
            adminId: user._id,
            actionType: "update_channel",
            details: `Updated channel: #${channel.name}`,
            timestamp: Date.now(),
        });
    },
});

/**
 * Delete a channel.
 */
export const deleteChannel = mutation({
    args: { channelId: v.id("spaceChannels") },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const channel = await ctx.db.get(args.channelId);
        if (!channel) throw new Error("Channel not found.");

        const space = await ctx.db.get(channel.spaceId);
        if (!space) throw new Error("Space not found.");

        const myRole = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", channel.spaceId).eq("userId", user._id))
            .unique();

        if (!myRole) throw new Error("Unauthorized: You are not a member of this space.");

        const isOwner = myRole.role === "owner";
        const isAdmin = myRole.role === "admin";
        const isMod = myRole.role === "moderator";

        const canEdit = isOwner ||
            (isAdmin && (space.adminCanEditChannels ?? true)) ||
            (isMod && (space.modCanEditChannels ?? false));

        if (!canEdit) {
            throw new Error("Unauthorized: You do not have permission to manage channels.");
        }

        await ctx.db.delete(args.channelId);

        // Log the action
        await ctx.db.insert("spaceAdminActions", {
            spaceId: channel.spaceId,
            adminId: user._id,
            actionType: "delete_channel",
            details: `Deleted channel: #${channel.name}`,
            timestamp: Date.now(),
        });
    },
});

/**
 * Mark a channel as read for the current user.
 */
export const markChannelAsRead = mutation({
    args: { channelId: v.id("spaceChannels") },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const existing = await ctx.db
            .query("spaceChannelReadStatus")
            .withIndex("by_user_channel", (q) => q.eq("userId", user._id).eq("channelId", args.channelId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { lastReadAt: Date.now() });
        } else {
            await ctx.db.insert("spaceChannelReadStatus", {
                userId: user._id,
                channelId: args.channelId,
                lastReadAt: Date.now(),
            });
        }
    },
});

/**
 * Get unread statuses for all channels in a space for the current user.
 */
export const getUnreadStatuses = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx).catch(() => null);
        if (!user) return {};

        const channels = await ctx.db
            .query("spaceChannels")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .collect();

        const statuses = await ctx.db
            .query("spaceChannelReadStatus")
            .filter((q) => q.eq(q.field("userId"), user._id))
            .collect();

        const statusMap = new Map(statuses.map((s) => [s.channelId, s.lastReadAt]));
        const result: Record<string, boolean> = {};

        for (const channel of channels) {
            const lastReadAt = statusMap.get(channel._id) || 0;

            if (channel.type === "schedule") {
                // Check for new events
                const events = await ctx.db
                    .query("spaceEvents")
                    .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
                    .collect();
                result[channel._id] = events.some((e) => e.createdAt > lastReadAt);
            } else if (channel.type === "polls") {
                // Check for new polls
                const polls = await ctx.db
                    .query("spacePolls")
                    .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
                    .collect();
                result[channel._id] = polls.some((p) => p.createdAt > lastReadAt);
            } else if (channel.type === "text") {
                // Check for new messages
                const newestMessage = await ctx.db
                    .query("spaceChannelMessages")
                    .withIndex("by_channel_time", (q) => q.eq("channelId", channel._id))
                    .order("desc")
                    .first();
                result[channel._id] = !!newestMessage && newestMessage.createdAt > lastReadAt;
            } else {
                result[channel._id] = false;
            }
        }

        return result;
    },
});
/**
 * Update channel management permissions for a space.
 */
export const updateChannelPermissions = mutation({
    args: {
        spaceId: v.id("spaces"),
        adminCanEdit: v.optional(v.boolean()),
        modCanEdit: v.optional(v.boolean()),
        adminCanPostInReadOnly: v.optional(v.boolean()),
        modCanPostInReadOnly: v.optional(v.boolean()),
        adminCanCreatePolls: v.optional(v.boolean()),
        modCanCreatePolls: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!membership || membership.role !== "owner") {
            throw new Error("Only owners can change permissions.");
        }

        const updates: any = {};
        if (args.adminCanEdit !== undefined) updates.adminCanEditChannels = args.adminCanEdit;
        if (args.modCanEdit !== undefined) updates.modCanEditChannels = args.modCanEdit;
        if (args.adminCanPostInReadOnly !== undefined) updates.adminCanPostInReadOnly = args.adminCanPostInReadOnly;
        if (args.modCanPostInReadOnly !== undefined) updates.modCanPostInReadOnly = args.modCanPostInReadOnly;
        if (args.adminCanCreatePolls !== undefined) updates.adminCanCreatePolls = args.adminCanCreatePolls;
        if (args.modCanCreatePolls !== undefined) updates.modCanCreatePolls = args.modCanCreatePolls;

        await ctx.db.patch(args.spaceId, updates);
    },
});

/**
 * Reorder categories in a space.
 */
export const reorderCategories = mutation({
    args: {
        spaceId: v.id("spaces"),
        categories: v.array(v.object({
            id: v.id("spaceCategories"),
            order: v.number(),
        })),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
            throw new Error("Unauthorized");
        }

        for (const cat of args.categories) {
            await ctx.db.patch(cat.id, { order: cat.order });
        }
    },
});

/**
 * Reorder channels and optionally move them to a different category.
 */
export const reorderChannels = mutation({
    args: {
        spaceId: v.id("spaces"),
        channels: v.array(v.object({
            id: v.id("spaceChannels"),
            channelOrder: v.number(),
            categoryId: v.optional(v.id("spaceCategories")),
        })),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
            if (membership?.role === "moderator") {
                const space = await ctx.db.get(args.spaceId);
                if (!space?.modCanEditChannels) {
                    throw new Error("Unauthorized");
                }
            } else {
                throw new Error("Unauthorized");
            }
        }

        for (const ch of args.channels) {
            const patch: any = { channelOrder: ch.channelOrder };
            if (ch.categoryId !== undefined) {
                patch.categoryId = ch.categoryId;
            }
            await ctx.db.patch(ch.id, patch);
        }
    },
});

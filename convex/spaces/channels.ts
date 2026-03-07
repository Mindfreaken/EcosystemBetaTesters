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
 * Update channel management permissions for a space.
 */
export const updateChannelPermissions = mutation({
    args: {
        spaceId: v.id("spaces"),
        adminCanEdit: v.optional(v.boolean()),
        modCanEdit: v.optional(v.boolean()),
        adminCanPostInReadOnly: v.optional(v.boolean()),
        modCanPostInReadOnly: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const space = await ctx.db.get(args.spaceId);
        if (!space) throw new Error("Space not found.");
        if (space.ownerId !== user._id) throw new Error("Unauthorized: Only the owner can change channel permissions.");

        const patches: any = {};
        if (args.adminCanEdit !== undefined) patches.adminCanEditChannels = args.adminCanEdit;
        if (args.modCanEdit !== undefined) patches.modCanEditChannels = args.modCanEdit;
        if (args.adminCanPostInReadOnly !== undefined) patches.adminCanPostInReadOnly = args.adminCanPostInReadOnly;
        if (args.modCanPostInReadOnly !== undefined) patches.modCanPostInReadOnly = args.modCanPostInReadOnly;

        await ctx.db.patch(args.spaceId, patches);

        // Log the action
        await ctx.db.insert("spaceAdminActions", {
            spaceId: args.spaceId,
            adminId: user._id,
            actionType: "update_channel_permissions",
            details: "Updated channel management permissions.",
            timestamp: Date.now(),
        });
    },
});


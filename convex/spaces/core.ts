import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ensureUserActive } from "../auth/helpers";

/**
 * Get the number of spaces owned by the current user.
 */
export const getUserOwnedSpacesCount = query({
    args: {},
    handler: async (ctx) => {
        const user = await ensureUserActive(ctx).catch(() => null);
        if (!user) return 0;

        const ownedSpaces = await ctx.db
            .query("spaces")
            .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
            .collect();

        return ownedSpaces.length;
    },
});

/**
 * Get the list of spaces the current user is a member of.
 */
export const getUserSpaces = query({
    args: {},
    handler: async (ctx) => {
        const user = await ensureUserActive(ctx).catch(() => null);
        if (!user) return [];

        const memberships = await ctx.db
            .query("spaceMembers")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        const spaces = await Promise.all(
            memberships.map((m) => ctx.db.get(m.spaceId))
        );

        return spaces.filter((s) => s !== null);
    },
});

/**
 * Get a single space by its ID.
 */
export const getSpace = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.spaceId);
    },
});

/**
 * Create a new space and assign the current user as the owner.
 */
export const createSpace = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        isPublic: v.boolean(),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);

        if (args.name.length > 32) throw new Error("Space name cannot exceed 32 characters.");
        if (args.description && args.description.length > 150) throw new Error("Description cannot exceed 150 characters.");

        // Enforce limit: max 5 owned spaces
        const ownedCount = await ctx.db
            .query("spaces")
            .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
            .collect();

        if (ownedCount.length >= 5) {
            throw new Error("You have reached the maximum limit of 5 owned spaces.");
        }

        const now = Date.now();
        const spaceId = await ctx.db.insert("spaces", {
            name: args.name,
            description: args.description,
            ownerId: user._id,
            createdAt: now,
            updatedAt: now,
            isPublic: args.isPublic,
        });

        // Add the creator as a member with "owner" role
        await ctx.db.insert("spaceMembers", {
            spaceId,
            userId: user._id,
            role: "owner",
            joinedAt: now,
        });

        const defaultChannelId = await ctx.db.insert("spaceChannels", {
            spaceId,
            name: "general",
            type: "text",
            description: "The default discussion channel for everyone.",
            channelOrder: 0,
            createdAt: now,
        });

        // Add welcome message
        await ctx.db.insert("spaceChannelMessages", {
            channelId: defaultChannelId,
            senderId: user._id,
            content: `Welcome to the ${args.name} space!`,
            createdAt: now,
        });

        return spaceId;
    },
});

/**
 * Update space metadata (name, avatar, cover).
 */
export const updateSpaceMetadata = mutation({
    args: {
        spaceId: v.id("spaces"),
        name: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        coverUrl: v.optional(v.string()),
        description: v.optional(v.string()),
        livekitUrl: v.optional(v.string()),
        hideAssistantAvatarTip: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
            throw new Error("Unauthorized: Only owners and admins can update space metadata.");
        }

        if (args.name && args.name.length > 32) throw new Error("Space name cannot exceed 32 characters.");
        if (args.description && args.description.length > 150) throw new Error("Description cannot exceed 150 characters.");

        const updates: any = { updatedAt: Date.now() };
        if (args.name !== undefined) updates.name = args.name;
        if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;
        if (args.coverUrl !== undefined) updates.coverUrl = args.coverUrl;
        if (args.description !== undefined) updates.description = args.description;
        if (args.livekitUrl !== undefined) updates.livekitUrl = args.livekitUrl;
        if (args.hideAssistantAvatarTip !== undefined) updates.hideAssistantAvatarTip = args.hideAssistantAvatarTip;

        await ctx.db.patch(args.spaceId, updates);

        // Log the action
        let details = "Updated space metadata";
        if (args.name) details = `Updated space name to "${args.name}"`;
        else if (args.description) details = `Updated space description`;
        else if (args.avatarUrl) details = `Updated space avatar`;
        else if (args.coverUrl) details = `Updated space cover photo`;
        else if (args.livekitUrl !== undefined) details = `Updated LiveKit configuration`;

        await ctx.db.insert("spaceAdminActions", {
            spaceId: args.spaceId,
            adminId: user._id,
            actionType: "update_metadata",
            details,
            timestamp: Date.now(),
        });
    },
});

/**
 * Delete a space.
 */
export const deleteSpace = mutation({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const space = await ctx.db.get(args.spaceId);
        if (!space) throw new Error("Space not found.");
        if (space.ownerId !== user._id) throw new Error("Unauthorized: Only the owner can delete the space.");

        // Delete all members, invites, actions, and stats
        const members = await ctx.db.query("spaceMembers").withIndex("by_space", (q) => q.eq("spaceId", args.spaceId)).collect();
        const invites = await ctx.db.query("spaceInvites").withIndex("by_space", (q) => q.eq("spaceId", args.spaceId)).collect();
        const actions = await ctx.db.query("spaceAdminActions").withIndex("by_space", (q) => q.eq("spaceId", args.spaceId)).collect();
        const categories = await ctx.db.query("spaceCategories").withIndex("by_space", (q) => q.eq("spaceId", args.spaceId)).collect();

        await Promise.all(members.map((m) => ctx.db.delete(m._id)));
        await Promise.all(invites.map((i) => ctx.db.delete(i._id)));
        await Promise.all(actions.map((a) => ctx.db.delete(a._id)));
        await Promise.all(categories.map((c) => ctx.db.delete(c._id)));

        await ctx.db.delete(args.spaceId);
    },
});

/**
 * Toggle space privacy status.
 */
export const updateSpacePrivacy = mutation({
    args: { spaceId: v.id("spaces"), isPublic: v.boolean() },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const space = await ctx.db.get(args.spaceId);
        if (!space) throw new Error("Space not found.");
        if (space.ownerId !== user._id) throw new Error("Unauthorized: Only the owner can change privacy.");

        await ctx.db.patch(args.spaceId, { isPublic: args.isPublic });

        // Log the action
        await ctx.db.insert("spaceAdminActions", {
            spaceId: args.spaceId,
            adminId: user._id,
            actionType: "update_privacy",
            details: `Changed space privacy to ${args.isPublic ? "Public" : "Private"}`,
            timestamp: Date.now(),
        });
    },
});

/**
 * Get current active user profile (display name, avatar, etc.)
 */
export const getMe = query({
    args: {},
    handler: async (ctx) => {
        const user = await ensureUserActive(ctx).catch(() => null);
        if (!user) return null;
        return {
            _id: user._id,
            displayName: user.displayName,
            username: user.username,
            avatarUrl: user.avatarUrl,
        };
    },
});


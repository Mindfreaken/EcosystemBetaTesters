import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ensureUserActive } from "../auth/helpers";

/**
 * Generate an upload URL for custom emojis.
 */
export const generateEmojiUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        await ensureUserActive(ctx);
        return await ctx.storage.generateUploadUrl();
    },
});

/**
 * Save a custom emoji for a space.
 */
export const saveCustomEmoji = mutation({
    args: {
        spaceId: v.id("spaces"),
        name: v.string(),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);

        // Check if user is admin or owner
        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
            throw new Error("Unauthorized: Only admins can upload emojis.");
        }

        const name = args.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (name.length > 20) throw new Error("Emoji name must be 20 characters or less.");

        // Check for duplicate name in space
        const existing = await ctx.db
            .query("spaceCustomEmojis")
            .withIndex("by_space_name", (q) => q.eq("spaceId", args.spaceId).eq("name", name))
            .unique();

        if (existing) throw new Error("An emoji with this name already exists in this space.");

        // Check tier limits
        const space = await ctx.db.get(args.spaceId);
        if (!space) throw new Error("Space not found.");

        const tier = space.tier || "free";
        if (tier === "free") {
            const count = (await ctx.db
                .query("spaceCustomEmojis")
                .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
                .collect()).length;

            if (count >= 75) {
                throw new Error("Free tier limit reached: You can only have 75 custom emojis. Upgrade to Premium for more!");
            }
        }

        const emojiId = await ctx.db.insert("spaceCustomEmojis", {
            spaceId: args.spaceId,
            name,
            storageId: args.storageId,
            createdBy: user._id,
            createdAt: Date.now(),
        });

        // Log the action
        await ctx.db.insert("spaceAdminActions", {
            spaceId: args.spaceId,
            adminId: user._id,
            actionType: "add_emoji",
            details: `Uploaded custom emoji :${name}:`,
            timestamp: Date.now(),
        });

        return emojiId;
    },
});

export const deleteCustomEmoji = mutation({
    args: { emojiId: v.id("spaceCustomEmojis") },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const emoji = await ctx.db.get(args.emojiId);
        if (!emoji) throw new Error("Emoji not found.");

        const membership = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", emoji.spaceId).eq("userId", user._id))
            .unique();

        if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
            throw new Error("Unauthorized: Only admins can delete emojis.");
        }

        await ctx.storage.delete(emoji.storageId);
        await ctx.db.delete(args.emojiId);

        // Log the action
        await ctx.db.insert("spaceAdminActions", {
            spaceId: emoji.spaceId,
            adminId: user._id,
            actionType: "delete_emoji",
            details: `Deleted custom emoji :${emoji.name}:`,
            timestamp: Date.now(),
        });
    },
});

/**
 * Get custom emojis for a space.
 */
export const getSpaceCustomEmojis = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        const emojis = await ctx.db
            .query("spaceCustomEmojis")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .collect();

        return await Promise.all(
            emojis.map(async (e) => ({
                ...e,
                url: await ctx.storage.getUrl(e.storageId),
            }))
        );
    },
});


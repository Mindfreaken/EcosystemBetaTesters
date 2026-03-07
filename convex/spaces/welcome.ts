import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ensureUserActive } from "../auth/helpers";

/**
 * Setup a generic welcome category with rules and announcements.
 */
export const setupWelcomeCategory = mutation({
    args: {
        spaceId: v.id("spaces"),
        announcementText: v.optional(v.string()),
        rulesItems: v.optional(v.array(v.object({
            id: v.string(),
            title: v.string(),
            description: v.string()
        })))
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);
        const space = await ctx.db.get(args.spaceId);
        if (!space) throw new Error("Space not found.");

        const myRole = await ctx.db
            .query("spaceMembers")
            .withIndex("by_space_user", (q) => q.eq("spaceId", args.spaceId).eq("userId", user._id))
            .unique();

        if (!myRole || (myRole.role !== "owner" && myRole.role !== "admin" && myRole.role !== "moderator")) {
            throw new Error("Unauthorized: Only staff can setup Welcome categories.");
        }

        const existingWelcomeCategory = await ctx.db
            .query("spaceCategories")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .filter(q => q.eq(q.field("name"), "welcome"))
            .unique();

        if (existingWelcomeCategory) {
            await ctx.db.delete(existingWelcomeCategory._id);
        }

        // Find existing channels by name (they may have been in a category before)
        const channels = await ctx.db
            .query("spaceChannels")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .collect();

        const rulesChannel = channels.find(c => c.name === "rules");
        let rulesChannelId = rulesChannel?._id;

        const announcementsChannel = channels.find(c => c.name === "announcements");
        let announcementsChannelId = announcementsChannel?._id;

        // If they exist, ensure they are uncategorized
        if (rulesChannel && rulesChannel.categoryId) {
            await ctx.db.patch(rulesChannel._id, { categoryId: undefined });
        }
        if (announcementsChannel && announcementsChannel.categoryId) {
            await ctx.db.patch(announcementsChannel._id, { categoryId: undefined });
        }

        // Insert channels if they don't exist
        if (!rulesChannelId) {
            rulesChannelId = await ctx.db.insert("spaceChannels", {
                spaceId: args.spaceId,
                name: "rules",
                type: "text",
                description: "Space rules and guidelines.",
                channelOrder: 0,
                isReadOnly: true,
                createdAt: Date.now(),
            });
        }

        if (!announcementsChannelId) {
            announcementsChannelId = await ctx.db.insert("spaceChannels", {
                spaceId: args.spaceId,
                name: "announcements",
                type: "text",
                description: "Important updates and announcements.",
                channelOrder: 1,
                isReadOnly: true,
                createdAt: Date.now(),
            });
        }

        const now = Date.now();

        // Clear existing messages
        const rulesMessages = await ctx.db
            .query("spaceChannelMessages")
            .withIndex("by_channel_time", q => q.eq("channelId", rulesChannelId!))
            .collect();
        for (const msg of rulesMessages) await ctx.db.delete(msg._id);

        // Send initial messages
        if (args.rulesItems && args.rulesItems.length > 0) {
            const content = "=== SERVER RULES ===\n\n" + args.rulesItems.map(rule => {
                const depth = Math.max(0, rule.id.split('.').length - 1);
                const indent = "    ".repeat(depth);
                return `${indent}${rule.id}. ${rule.title}\n${indent}${rule.description}`;
            }).join("\n\n");
            await ctx.db.insert("spaceChannelMessages", {
                channelId: rulesChannelId,
                senderId: user._id,
                content,
                createdAt: now,
            });
        }

        // Only insert an announcement if it's explicitly provided
        if (args.announcementText && args.announcementText.trim() !== "") {
            await ctx.db.insert("spaceChannelMessages", {
                channelId: announcementsChannelId,
                senderId: user._id,
                content: args.announcementText,
                createdAt: now,
            });
        }

        await ctx.db.insert("spaceAdminActions", {
            spaceId: args.spaceId,
            adminId: user._id,
            actionType: "setup_welcome",
            details: (rulesChannel || announcementsChannel) ? "Updated Rules and Announcements." : "Set up Rules and Announcements.",
            timestamp: now,
        });

        return undefined;
    }
});

/**
 * Fetch existing Welcome category content to pre-fill the edit form.
 */
export const getWelcomeContent = query({
    args: { spaceId: v.id("spaces") },
    handler: async (ctx, args) => {
        const category = await ctx.db
            .query("spaceCategories")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .filter(q => q.eq(q.field("name"), "welcome"))
            .first();

        if (!category) return null;

        const channels = await ctx.db
            .query("spaceChannels")
            .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
            .filter(q => q.eq(q.field("categoryId"), category._id))
            .collect();

        const rulesChannel = channels.find(c => c.name === "rules");
        const announcementsChannel = channels.find(c => c.name === "announcements");

        let rulesText = "";

        if (rulesChannel) {
            const rulesMsg = await ctx.db
                .query("spaceChannelMessages")
                .withIndex("by_channel_time", q => q.eq("channelId", rulesChannel._id))
                .first();
            if (rulesMsg) rulesText = rulesMsg.content;
        }

        return { rulesText };
    }
});


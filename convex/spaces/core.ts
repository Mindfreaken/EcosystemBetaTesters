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
        if (!user) return { count: 0, max: 5 };

        const ownedSpaces = await ctx.db
            .query("spaces")
            .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
            .collect();

        return {
            count: ownedSpaces.length,
            max: user.maxSpaces ?? 5,
        };
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
 * Get the list of spaces a specific user is a member of.
 */
export const getPublicUserSpaces = query({
    args: { userId: v.union(v.id("users"), v.null()) },
    handler: async (ctx, args) => {
        if (!args.userId) return [];
        const memberships = await ctx.db
            .query("spaceMembers")
            .withIndex("by_user", (q) => q.eq("userId", args.userId as Id<"users">))
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
        avatarUrl: v.optional(v.string()),
        coverUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ensureUserActive(ctx);

        if (args.name.length > 32) throw new Error("Space name cannot exceed 32 characters.");
        if (args.description && args.description.length > 150) throw new Error("Description cannot exceed 150 characters.");
        
        // Check for unique name
        const existingWithName = await ctx.db
            .query("spaces")
            .withIndex("by_name", (q) => q.eq("name", args.name))
            .unique();
        if (existingWithName) throw new Error(`A space with the name "${args.name}" already exists.`);

        // Enforce limit: use the user's maxSpaces or default to 5
        const ownedCount = await ctx.db
            .query("spaces")
            .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
            .collect();

        const limit = user.maxSpaces ?? 5;
        if (ownedCount.length >= limit) {
            throw new Error(`You have reached the maximum limit of ${limit} owned spaces.`);
        }

        const now = Date.now();
        const spaceId = await ctx.db.insert("spaces", {
            name: args.name,
            description: args.description,
            ownerId: user._id,
            avatarUrl: args.avatarUrl,
            coverUrl: args.coverUrl,
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

        // Create specialized #rules channel
        await ctx.db.insert("spaceChannels", {
            spaceId,
            name: "rules",
            type: "text",
            description: "The official space rules.",
            channelOrder: 1,
            isReadOnly: true,
            createdAt: now,
        });

        // Populate default rules
        const defaultRules = [
            { title: "Be Respectful", description: "Treat all members with kindness and respect." },
            { title: "No Spam", description: "Avoid excessive messaging or self-promotion without permission." },
            { title: "Follow Guidelines", description: "Adhere to the community guidelines at all times." },
            { title: "Keep Content Relevant", description: "Post in the appropriate channels and stay on topic." },
            { title: "No Hate Speech", description: "Discrimination or harassment of any kind will not be tolerated." },
            { title: "Protect Privacy", description: "Do not share personal information of yourself or others." },
            { title: "Appropriate Content", description: "Avoid NSFW or offensive material in public channels." },
            { title: "No Self-Promotion", description: "Do not advertise products, services, or other communities without permission." },
            { title: "Respect Staff", description: "Follow instructions from moderators and admins." },
            { title: "Report Issues", description: "Notify staff if you see someone breaking the rules or encounter problems." }
        ];

        for (let i = 0; i < defaultRules.length; i++) {
            await ctx.db.insert("spaceRules", {
                spaceId,
                title: defaultRules[i].title,
                description: defaultRules[i].description,
                order: i,
                createdAt: now
            });
        }

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

        if (args.name) {
            const nameToUpdate = args.name;
            const existingWithName = await ctx.db
                .query("spaces")
                .withIndex("by_name", (q) => q.eq("name", nameToUpdate))
                .unique();
            if (existingWithName && existingWithName._id !== args.spaceId) {
                throw new Error(`A space with the name "${nameToUpdate}" already exists.`);
            }
        }

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

        // 1. Delete Channels and their children (messages, reactions)
        const channels = await ctx.db.query("spaceChannels").withIndex("by_space", (q) => q.eq("spaceId", args.spaceId)).collect();
        for (const channel of channels) {
            const messages = await ctx.db.query("spaceChannelMessages").withIndex("by_channel_time", (q) => q.eq("channelId", channel._id)).collect();
            for (const msg of messages) {
                const reactions = await ctx.db.query("spaceChannelMessageReactions").withIndex("by_message", (q) => q.eq("messageId", msg._id)).collect();
                await Promise.all(reactions.map((r) => ctx.db.delete(r._id)));
                await ctx.db.delete(msg._id);
            }
            await ctx.db.delete(channel._id);
        }

        // 2. Delete Polls and Votes
        const polls = await ctx.db.query("spacePolls").withIndex("by_space", (q) => q.eq("spaceId", args.spaceId)).collect();
        for (const poll of polls) {
            const votes = await ctx.db.query("spacePollVotes").withIndex("by_poll", (q) => q.eq("pollId", poll._id)).collect();
            await Promise.all(votes.map((v) => ctx.db.delete(v._id)));
            await ctx.db.delete(poll._id);
        }

        // 3. Delete other space-related data
        const collections = [
            "spaceMembers", 
            "spaceInvites", 
            "spaceAdminActions", 
            "spaceCategories",
            "spaceRules",
            "spaceRoles",
            "spaceMemberRoles",
            "spaceEvents",
            "spaceCustomEmojis",
            "spaceDailyStats",
            "spaceDailyActive",
            "spaceMonthlyActive",
            "spaceMemberNotes",
            "spaceVoicePresence"
        ];

        for (const collection of collections) {
            const items = await ctx.db.query(collection as any).withIndex("by_space", (q: any) => q.eq("spaceId", args.spaceId)).collect();
            await Promise.all(items.map((i) => ctx.db.delete(i._id)));
        }

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


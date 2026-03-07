import { defineTable } from "convex/server";
import { v } from "convex/values";

export const spacesTables = {
    spaces: defineTable({
        name: v.string(),
        ownerId: v.id("users"),
        description: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        coverUrl: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
        isPublic: v.boolean(),
        allowInvites: v.optional(v.boolean()), // If false, no new members can join via invites
        adminCanEditChannels: v.optional(v.boolean()),
        modCanEditChannels: v.optional(v.boolean()),
        adminCanPostInReadOnly: v.optional(v.boolean()),
        modCanPostInReadOnly: v.optional(v.boolean()),
        tier: v.optional(v.string()), // "free" | "premium"
        livekitUrl: v.optional(v.string()), // For voice/video calling
    })
        .index("by_owner", ["ownerId"])
        .index("by_name", ["name"]),

    spaceMembers: defineTable({
        spaceId: v.id("spaces"),
        userId: v.id("users"),
        role: v.string(), // "owner" | "admin" | "member"
        joinedAt: v.number(),
        invitedBy: v.optional(v.id("users")), // Who invited this person
        timeoutUntil: v.optional(v.number()), // Timestamp until user is timed out
    })
        .index("by_space", ["spaceId"])
        .index("by_user", ["userId"])
        .index("by_space_user", ["spaceId", "userId"]),

    spaceInvites: defineTable({
        spaceId: v.id("spaces"),
        invitedBy: v.id("users"),
        code: v.string(), // Unique 8-10 char code
        maxUses: v.optional(v.number()),
        uses: v.number(),
        expiresAt: v.optional(v.number()),
        isRevoked: v.boolean(),
        createdAt: v.number(),
    })
        .index("by_space", ["spaceId"])
        .index("by_code", ["code"])
        .index("by_creator", ["spaceId", "invitedBy"]),

    spaceBans: defineTable({
        spaceId: v.id("spaces"),
        userId: v.id("users"),
        bannedBy: v.id("users"),
        reason: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_space", ["spaceId"])
        .index("by_user", ["userId"])
        .index("by_space_user", ["spaceId", "userId"]),

    spaceAdminActions: defineTable({
        spaceId: v.id("spaces"),
        adminId: v.id("users"),
        actionType: v.string(), // "update_metadata" | "add_admin" | "remove_admin" | "etc"
        details: v.string(),
        timestamp: v.number(),
    })
        .index("by_space", ["spaceId"])
        .index("by_admin", ["adminId"])
        .index("by_space_admin", ["spaceId", "adminId"]),

    spaceDailyActive: defineTable({
        spaceId: v.id("spaces"),
        userId: v.id("users"),
        day: v.string(), // YYYY-MM-DD
        createdAt: v.number(),
    })
        .index("by_day", ["spaceId", "day"])
        .index("by_day_user", ["spaceId", "day", "userId"]),

    spaceMonthlyActive: defineTable({
        spaceId: v.id("spaces"),
        userId: v.id("users"),
        month: v.string(), // YYYY-MM
        createdAt: v.number(),
    })
        .index("by_month", ["spaceId", "month"])
        .index("by_month_user", ["spaceId", "month", "userId"]),

    spaceCategories: defineTable({
        spaceId: v.id("spaces"),
        name: v.string(),
        order: v.number(),
        createdAt: v.number(),
    })
        .index("by_space", ["spaceId"])
        .index("by_order", ["spaceId", "order"]),

    spaceChannels: defineTable({
        spaceId: v.id("spaces"),
        categoryId: v.optional(v.id("spaceCategories")),
        name: v.string(),
        type: v.string(), // "text" | "voice" | etc.
        description: v.optional(v.string()),
        channelOrder: v.number(),
        isReadOnly: v.optional(v.boolean()), // If true, only staff can post
        createdAt: v.number(),
    })
        .index("by_space", ["spaceId"])
        .index("by_order", ["spaceId", "channelOrder"]),

    spaceChannelMessages: defineTable({
        channelId: v.id("spaceChannels"),
        senderId: v.id("users"),
        content: v.string(),
        createdAt: v.number(),
        isEdited: v.optional(v.boolean()),
        isDeleted: v.optional(v.boolean()),
        replyToId: v.optional(v.id("spaceChannelMessages")),
    })
        .index("by_channel_time", ["channelId", "createdAt"]),

    spaceChannelMessageReactions: defineTable({
        messageId: v.id("spaceChannelMessages"),
        userId: v.id("users"),
        reaction: v.string(), // The emoji string or storageId for custom emojis
        createdAt: v.number(),
    })
        .index("by_message", ["messageId"])
        .index("by_message_user_reaction", ["messageId", "userId", "reaction"]),

    spaceCustomEmojis: defineTable({
        spaceId: v.id("spaces"),
        name: v.string(), // Shortcode like :cool:
        storageId: v.id("_storage"),
        createdBy: v.id("users"),
        createdAt: v.number(),
    })
        .index("by_space", ["spaceId"])
        .index("by_space_name", ["spaceId", "name"]),

    spaceVoicePresence: defineTable({
        spaceId: v.id("spaces"),
        channelId: v.id("spaceChannels"),
        userId: v.id("users"),
        joinedAt: v.number(),
        lastSeen: v.number(),
    })
        .index("by_space", ["spaceId"])
        .index("by_channel", ["channelId"])
        .index("by_user", ["userId"])
        .index("by_user_channel", ["userId", "channelId"]),
} as const;

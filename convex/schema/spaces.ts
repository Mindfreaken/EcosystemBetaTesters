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
        adminCanCreatePolls: v.optional(v.boolean()),
        modCanCreatePolls: v.optional(v.boolean()),
        tier: v.optional(v.string()), // "free" | "premium"
        livekitUrl: v.optional(v.string()), // For voice/video calling
        hideAssistantAvatarTip: v.optional(v.boolean()),
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
        .index("by_day_user", ["spaceId", "day", "userId"])
        .index("by_space", ["spaceId"]),

    spaceMonthlyActive: defineTable({
        spaceId: v.id("spaces"),
        userId: v.id("users"),
        month: v.string(), // YYYY-MM
        createdAt: v.number(),
    })
        .index("by_month", ["spaceId", "month"])
        .index("by_month_user", ["spaceId", "month", "userId"])
        .index("by_space", ["spaceId"]),

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
        isMuted: v.optional(v.boolean()),
        isDeafened: v.optional(v.boolean()),
        isStreaming: v.optional(v.boolean()),
    })
        .index("by_space", ["spaceId"])
        .index("by_channel", ["channelId"])
        .index("by_user", ["userId"])
        .index("by_user_channel", ["userId", "channelId"]),

    spaceMemberNotes: defineTable({
        spaceId: v.id("spaces"),
        userId: v.id("users"), // The member the note is about
        authorId: v.id("users"), // The staff member who wrote the note
        note: v.string(),
        createdAt: v.number(),
    })
        .index("by_space", ["spaceId"])
        .index("by_user", ["userId"])
        .index("by_space_user", ["spaceId", "userId"]),

    spaceEvents: defineTable({
        spaceId: v.id("spaces"),
        creatorId: v.id("users"),
        title: v.string(),
        description: v.optional(v.string()),
        startTime: v.number(),
        endTime: v.number(),
        showInAnnouncements: v.optional(v.boolean()),
        createdAt: v.number(),
    })
        .index("by_space", ["spaceId"])
        .index("by_space_time", ["spaceId", "startTime"]),

    spaceChannelReadStatus: defineTable({
        userId: v.id("users"),
        channelId: v.id("spaceChannels"),
        lastReadAt: v.number(),
    })
        .index("by_user_channel", ["userId", "channelId"]),

    spaceDailyStats: defineTable({
        spaceId: v.id("spaces"),
        day: v.string(), // YYYY-MM-DD
        totalMessages: v.number(),
        totalVoiceMinutes: v.number(),
    })
        .index("by_day", ["spaceId", "day"])
        .index("by_space", ["spaceId"]),

    spacePolls: defineTable({
        spaceId: v.id("spaces"),
        creatorId: v.id("users"),
        question: v.string(),
        options: v.array(v.string()),
        allowMultiSelect: v.boolean(),
        showInAnnouncements: v.boolean(),
        createdAt: v.number(),
        expiresAt: v.optional(v.number()),
    })
        .index("by_space", ["spaceId"])
        .index("by_creator", ["creatorId"]),

    spacePollVotes: defineTable({
        pollId: v.id("spacePolls"),
        userId: v.id("users"),
        optionIndices: v.array(v.number()),
        createdAt: v.number(),
    })
        .index("by_poll", ["pollId"])
        .index("by_poll_user", ["pollId", "userId"]),

    spaceRoles: defineTable({
        spaceId: v.id("spaces"),
        name: v.string(),
        color: v.string(), // Hex color
        style: v.string(), // "solid" | "gradient" | "holographic"
        gradientConfig: v.optional(v.object({
            color1: v.string(),
            color2: v.string(),
            angle: v.number(),
            isAnimated: v.boolean(),
        })),
        isHoisted: v.boolean(), // Display members separately in sidebar
        order: v.number(),
        isSystem: v.optional(v.boolean()),
        systemKey: v.optional(v.string()), // "owner", "admin", "moderator"
        createdAt: v.number(),
    })
        .index("by_space", ["spaceId"])
        .index("by_space_order", ["spaceId", "order"]),

    spaceMemberRoles: defineTable({
        spaceId: v.id("spaces"),
        userId: v.id("users"),
        roleId: v.id("spaceRoles"),
    })
        .index("by_space", ["spaceId"])
        .index("by_user", ["userId"])
        .index("by_role", ["roleId"])
        .index("by_space_user", ["spaceId", "userId"])
        .index("by_space_user_role", ["spaceId", "userId", "roleId"]),

    spaceRules: defineTable({
        spaceId: v.id("spaces"),
        title: v.string(),
        description: v.string(),
        order: v.number(),
        createdAt: v.number(),
    })
        .index("by_space", ["spaceId"])
        .index("by_space_order", ["spaceId", "order"]),
} as const;

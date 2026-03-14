import { defineTable } from "convex/server";
import { v } from "convex/values";

export const userSettingTables = {
  settings: defineTable({
    userId: v.optional(v.id("users")),
    theme: v.optional(v.string()),
    notifications: v.optional(v.boolean()),
    language: v.optional(v.string()),
    clerkUserId: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
    showCallsInHeader: v.optional(v.boolean()),
    useThemeColorForRage: v.optional(v.boolean()),
    nerdleKeyboardHintDismissed: v.optional(v.boolean()),
    disableThemeVoteConfirm: v.optional(v.boolean()),
    preferredMicrophoneId: v.optional(v.string()),
    preferredCameraId: v.optional(v.string()),
    preferredSpeakerId: v.optional(v.string()),
    isDeafened: v.optional(v.boolean()),
  }).index("by_clerk_id_unique", ["clerkUserId"]),

  userVoiceSettings: defineTable({
    ownerId: v.id("users"),
    targetUserId: v.string(), // Clerk ID from LiveKit
    volume: v.number(), // 0.0 to 1.0 (or something like that)
    lastUpdated: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_target", ["ownerId", "targetUserId"]),
} as const;

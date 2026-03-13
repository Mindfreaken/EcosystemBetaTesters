import { defineTable } from "convex/server";
import { v } from "convex/values";

export const usersCoreTables = {
  users: defineTable({
    username: v.optional(v.string()),
    usernameLower: v.optional(v.string()),
    displayName: v.optional(v.string()),
    displayNameLower: v.optional(v.string()),
    email: v.string(),
    emailLower: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    phoneE164: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    ecosystemdevs: v.optional(v.boolean()),
    lastSeen: v.optional(v.number()),
    status: v.optional(v.string()),
    customStatus: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    joinNumber: v.optional(v.number()),
    isBanned: v.optional(v.boolean()),
    role: v.optional(v.string()),
    clerkUserId: v.optional(v.string()),
    storageStatus: v.optional(v.union(v.literal('free'), v.literal('paid'))),
    totalStorageAllocatedGB: v.optional(v.number()),
    currentStorageUsedGB: v.optional(v.number()),
    xp: v.optional(v.number()),
    profileTypeId: v.optional(v.id("profileTypes")),
    // Overseer fields
    overseer: v.optional(v.boolean()),
    overseeradmin: v.optional(v.boolean()),
    overseerPoints: v.optional(v.number()),
    // Suspension fields
    suspensionStatus: v.optional(v.string()), // 'suspensionStage1', 'suspensionStageActive', 'suspensionStageFalse', 'suspensionStageAppeal', 'suspensionStageAppealDenied', 'suspensionStageAppealWon'
    bannedUntil: v.optional(v.number()),
    requiredProfileChanges: v.optional(v.array(v.string())), // e.g. ["displayName", "username", "bio", "avatarUrl", "coverUrl"]
  })
    .index("by_clerk_id", ["clerkUserId"])
    .index("by_storageStatus", ["storageStatus"])
    .index("by_username_lower", ["usernameLower"])
    .index("by_display_name_lower", ["displayNameLower"])
    .index("by_email_lower", ["emailLower"])
    .index("by_phone_e164", ["phoneE164"])
    .index("by_suspension_status", ["suspensionStatus"])
    .searchIndex("search_username", {
      searchField: "username",
    }),
} as const;

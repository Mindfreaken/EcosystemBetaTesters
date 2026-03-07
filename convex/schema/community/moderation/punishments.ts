import { defineTable } from "convex/server";
import { v } from "convex/values";

export const punishmentTables = {
  userPunishments: defineTable({
    userId: v.id("users"),
    punishmentTypeId: v.id("punishmentTypes"),
    targetUserId: v.optional(v.id("users")),
    appliedAt: v.number(),
    active: v.boolean(),
    affectSocialScore: v.optional(v.boolean()),
    appliedById: v.optional(v.id("users")),
    endAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"]) 
    .index("by_type_and_user", ["punishmentTypeId", "userId"]) 
    .index("by_applied_by", ["appliedById"]) 
    .index("by_type", ["punishmentTypeId"]),

  punishmentTypes: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    severity: v.optional(v.number()),
    pointValue: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    status: v.optional(v.string()),
  }).index("by_name", ["name"]),
} as const;

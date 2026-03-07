import { defineTable } from "convex/server";
import { v } from "convex/values";

export const userFriendCodeTables = {
  friendCodes: defineTable({
    userId: v.id("users"),
    code: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    usedBy: v.optional(v.array(v.id("users"))),
  })
    .index("by_user_and_isActive", ["userId", "isActive"]) // used by getActiveCode, generateNewCode
    .index("by_active_code", ["code", "isActive"]) // used by useFriendCode
    .index("by_code", ["code"]), // used by utils.generateFriendCode uniqueness check
} as const;

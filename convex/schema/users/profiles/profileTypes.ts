import { defineTable } from "convex/server";
import { v } from "convex/values";

export const userProfileTypeTables = {
  profileTypes: defineTable({
    name: v.string(),
    description: v.string(),
    iconUrl: v.optional(v.string()),
    createdAt: v.number(),
  }),
} as const;

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const userSystemParameterTables = {
  system_parameters: defineTable({
    doStorageBaseAllowanceGB: v.number(),
    freeUserStorageLimitGB: v.number(),
    systemUserId: v.optional(v.string()),
  }),
} as const;

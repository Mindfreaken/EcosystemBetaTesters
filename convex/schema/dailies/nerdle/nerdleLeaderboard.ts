import { defineTable } from "convex/server";
import { v } from "convex/values";

export const nerdleLeaderboardTables = {
  nerdleLeaderboards: defineTable({
    userId: v.id("users"),
    // null/undefined = rollup across all categories
    category: v.optional(v.string()),
    timeframe: v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly"),
      v.literal("all_time")
    ),
    // YYYY-MM-DD for the start of the window
    periodStart: v.string(),
    wins: v.number(),
  })
    .index("by_category_timeframe_periodStart", [
      "category",
      "timeframe",
      "periodStart",
    ])
    .index("by_user_category_timeframe", ["userId", "category", "timeframe"]),
} as const;
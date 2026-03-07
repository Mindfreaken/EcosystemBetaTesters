import { defineTable } from "convex/server";
import { v } from "convex/values";

export const analyticsTables = {
  hubDailyActive: defineTable({
    hub: v.string(),
    userId: v.id("users"),
    day: v.string(), // YYYY-MM-DD (UTC)
    createdAt: v.number(),
  })
    .index("by_day", ["hub", "day"]) // for DAU queries
    .index("by_day_user", ["hub", "day", "userId"]), // for idempotent upsert

  hubMonthlyActive: defineTable({
    hub: v.string(),
    userId: v.id("users"),
    month: v.string(), // YYYY-MM (UTC)
    createdAt: v.number(),
  })
    .index("by_month", ["hub", "month"]) // for MAU queries (calendar month)
    .index("by_month_user", ["hub", "month", "userId"]), // for idempotent upsert
} as const;

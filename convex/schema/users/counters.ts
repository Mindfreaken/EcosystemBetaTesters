import { defineTable } from "convex/server";
import { v } from "convex/values";

export const userCounterTables = {
  counters: defineTable({
    name: v.string(),
    value: v.number(),
  }).index("by_name", ["name"]),
} as const;

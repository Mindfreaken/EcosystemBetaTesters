import { defineTable } from "convex/server";
import { v } from "convex/values";

export const taskTables = {
  messageTasks: defineTable({
    messageId: v.id("messages"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    assignedTo: v.array(v.id("users")),
    dueDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    completedBy: v.optional(v.id("users")),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_message", ["messageId"]) 
    .index("by_assigned_user", ["assignedTo"]) 
    .index("by_status", ["status"]),
} as const;

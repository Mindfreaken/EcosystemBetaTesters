import { defineTable } from "convex/server";
import { v } from "convex/values";

export const overseerVoteTables = {
    overseerVotes: defineTable({
        reportId: v.id("chatReports"),
        overseerId: v.id("users"),
        vote: v.union(v.literal("suspend"), v.literal("ban"), v.literal("none"), v.literal("false_report"), v.literal("false_report_no_penalty"), v.literal("mod_action")),
        modActions: v.optional(v.array(v.string())),
        timestamp: v.number(),
    })
        .index("by_report", ["reportId"])
        .index("by_overseer", ["overseerId"])
        .index("by_report_and_overseer", ["reportId", "overseerId"]),
} as const;

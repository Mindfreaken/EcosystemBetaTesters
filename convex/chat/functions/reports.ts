import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";

// Submit a user report
export const submitUserReport = mutation({
  args: {
    reporterId: v.id("users"),
    targetUserId: v.id("users"),
    reason: v.string(),
    content: v.string(),
  },
  returns: v.id("chatReports"),
  handler: async (ctx, args) => {
    // Verify the reporter exists
    const reporter = await ctx.db.get(args.reporterId);
    if (!reporter) {
      throw new Error("Reporter not found");
    }

    // Verify the target user exists
    const targetUser = await ctx.db.get(args.targetUserId);
    if (!targetUser) {
      throw new Error("Target user not found");
    }

    // Create the report
    const reportId = await ctx.db.insert("chatReports", {
      reporterId: args.reporterId,
      targetUserId: args.targetUserId,
      reason: args.reason,
      content: args.content,
      status: "pending", // Initial status is pending
      timestamp: Date.now(),
    });

    return reportId;
  },
});

// Submit a file report
export const submitFileReport = mutation({
  args: {
    reporterId: v.id("users"),
    fileId: v.id("files"),
    reason: v.string(),
    content: v.string(),
  },
  returns: v.id("chatReports"),
  handler: async (ctx, args) => {
    // Verify the reporter exists
    const reporter = await ctx.db.get(args.reporterId);
    if (!reporter) {
      throw new Error("Reporter not found");
    }

    // Verify the file exists
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("File not found");
    }

    // Get the file owner
    const targetUserId = file.uploadedBy;

    // Create the report
    const reportId = await ctx.db.insert("chatReports", {
      reporterId: args.reporterId,
      fileId: args.fileId,
      targetUserId,
      reason: args.reason,
      content: args.content,
      status: "pending", // Initial status is pending
      timestamp: Date.now(),
    });

    return reportId;
  },
});

// Submit a message report
export const submitMessageReport = mutation({
  args: {
    reporterId: v.id("users"),
    messageId: v.id("messages"),
    reason: v.string(),
    content: v.string(),
  },
  returns: v.id("chatReports"),
  handler: async (ctx, args) => {
    // Verify the reporter exists
    const reporter = await ctx.db.get(args.reporterId);
    if (!reporter) {
      throw new Error("Reporter not found");
    }

    // Verify the message exists
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Get the message sender
    const targetUserId = message.senderId;

    // Create the report
    const reportId = await ctx.db.insert("chatReports", {
      reporterId: args.reporterId,
      messageId: args.messageId,
      targetUserId,
      reason: args.reason,
      content: args.content,
      status: "pending", // Initial status is pending
      timestamp: Date.now(),
    });

    return reportId;
  },
});

// Get reports submitted by a user
export const getReportsByUser = query({
  args: {
    reporterId: v.id("users"),
  },
  returns: v.array(
    v.object({
      _id: v.id("chatReports"),
      _creationTime: v.number(),
      reporterId: v.id("users"),
      targetUserId: v.optional(v.id("users")),
      messageId: v.optional(v.id("messages")),
      fileId: v.optional(v.id("files")),
      reason: v.string(),
      status: v.string(),
      content: v.string(),
      timestamp: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatReports")
      .withIndex("by_reporter", (q) => q.eq("reporterId", args.reporterId))
      .collect();
  },
});

// Get reports against a specific user
export const getReportsAgainstUser = query({
  args: {
    targetUserId: v.id("users"),
  },
  returns: v.array(
    v.object({
      _id: v.id("chatReports"),
      _creationTime: v.number(),
      reporterId: v.id("users"),
      targetUserId: v.optional(v.id("users")),
      messageId: v.optional(v.id("messages")),
      fileId: v.optional(v.id("files")),
      reason: v.string(),
      status: v.string(),
      content: v.string(),
      timestamp: v.number(),
      decryptedContent: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatReports")
      .withIndex("by_target_user", (q) => q.eq("targetUserId", args.targetUserId))
      .collect();
  },
});

// Get reports against a specific file
export const getReportsForFile = query({
  args: {
    fileId: v.id("files"),
  },
  returns: v.array(
    v.object({
      _id: v.id("chatReports"),
      _creationTime: v.number(),
      reporterId: v.id("users"),
      targetUserId: v.optional(v.id("users")),
      fileId: v.optional(v.id("files")),
      reason: v.string(),
      status: v.string(),
      content: v.string(),
      timestamp: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatReports")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .collect();
  },
});

// Get reports for a specific message
export const getReportsForMessage = query({
  args: {
    messageId: v.id("messages"),
  },
  returns: v.array(
    v.object({
      _id: v.id("chatReports"),
      _creationTime: v.number(),
      reporterId: v.id("users"),
      targetUserId: v.optional(v.id("users")),
      messageId: v.optional(v.id("messages")),
      fileId: v.optional(v.id("files")),
      reason: v.string(),
      status: v.string(),
      content: v.string(),
      timestamp: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatReports")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .collect();
  },
});

// Update report status (for moderators)
export const updateReportStatus = mutation({
  args: {
    reportId: v.id("chatReports"),
    status: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    await ctx.db.patch(args.reportId, {
      status: args.status,
    });

    return null;
  },
});

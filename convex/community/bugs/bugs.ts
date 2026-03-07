import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";

// Types
const severityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical")
);

const statusValidator = v.union(
  v.literal("open"),
  v.literal("in_progress"),
  v.literal("resolved"),
  v.literal("closed")
);

async function isMaintainer(ctx: any): Promise<boolean> {
  // Allow admins by role as fallback
  const identity = await ctx.auth.getUserIdentity?.();
  const privilegedClerkId = process.env.STAFF_CLERK_ID;
  const subject = identity?.subject || identity?.tokenIdentifier || null;

  // Primary: match configured Clerk ID
  if (subject && privilegedClerkId && subject === privilegedClerkId) return true;

  // Fallback: if a Users row exists and is admin/staff
  if (!identity?.subject) return false;
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkUserId", identity.subject))
    .first();
  if (!user) return false;
  if (user.isAdmin) return true;
  if ((user as any).ecosystemdevs === true) return true;
  if ((user as any).role && (((user as any).role === "admin") || ((user as any).role === "staff"))) return true;
  return false;
}

// Public query to let client hide maintainer-only controls without leaking IDs
export const isBugMaintainer = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    return await isMaintainer(ctx);
  },
});

// Delete a bug (reporter or maintainer only)
export const deleteBug = mutation({
  args: { bugId: v.id("bugs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const bug = await ctx.db.get(args.bugId);
    if (!bug) throw new Error("Bug not found");
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) throw new Error("Unauthorized");
    const isMaint = await isMaintainer(ctx);
    const isReporter = bug.reporterId && user._id && (bug.reporterId as any).toString() === (user._id as any).toString();
    if (!isMaint && !isReporter) throw new Error("Forbidden");
    await ctx.db.delete(args.bugId);
    // Optionally delete comments
    const comments = await ctx.db.query("bugComments").withIndex("by_bug", (q) => q.eq("bugId", args.bugId)).collect();
    for (const c of comments) await ctx.db.delete(c._id);
    return null;
  },
});

// Identity-based upvote toggle (client-friendly)
export const toggleUpvoteByIdentity = mutation({
  args: { bugId: v.id("bugs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not signed in");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");
    const bug = await ctx.db.get(args.bugId);
    if (!bug) throw new Error("Bug not found");
    const upvoters: Id<"users">[] = (bug.upvoters as Id<"users">[]) || [];
    const has = upvoters.find((id) => id.toString() === (user._id as Id<"users">).toString());
    let next: Id<"users">[];
    if (has) {
      next = upvoters.filter((id) => id.toString() !== (user._id as Id<"users">).toString());
    } else {
      next = [...upvoters, user._id as Id<"users">];
    }
    await ctx.db.patch(args.bugId, { upvoters: next, updatedAt: Date.now() });
    return null;
  },
});

// Identity-based create (auto set reporter)
export const createBugByIdentity = mutation({
  args: { title: v.string(), description: v.string(), topic: v.string(), severity: severityValidator, tags: v.optional(v.array(v.string())) },
  returns: v.id("bugs"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let reporterId: Id<"users"> | undefined = undefined;
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
        .unique();
      if (user) reporterId = user._id as Id<"users">;
    }
    const now = Date.now();
    const bugId = await ctx.db.insert("bugs", {
      title: args.title,
      description: args.description,
      topic: args.topic,
      reporterId,
      status: "open",
      severity: args.severity,
      tags: args.tags,
      upvoters: [],
      createdAt: now,
      updatedAt: now,
    });
    return bugId as Id<"bugs">;
  },
});

// Create a new bug
export const createBug = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    topic: v.string(),
    reporterId: v.optional(v.id("users")),
    severity: severityValidator,
    tags: v.optional(v.array(v.string())),
  },
  returns: v.id("bugs"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const bugId = await ctx.db.insert("bugs", {
      title: args.title,
      description: args.description,
      topic: args.topic,
      reporterId: args.reporterId,
      status: "open",
      severity: args.severity,
      tags: args.tags,
      upvoters: [],
      createdAt: now,
      updatedAt: now,
    });
    return bugId;
  },
});

// List bugs with simple filters
export const listBugs = query({
  args: {
    status: v.optional(statusValidator),
    severity: v.optional(severityValidator),
    topic: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("bugs"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      topic: v.string(),
      reporterId: v.optional(v.id("users")),
      status: statusValidator,
      severity: severityValidator,
      tags: v.optional(v.array(v.string())),
      maintainerNote: v.optional(v.string()),
      upvoters: v.optional(v.array(v.id("users"))),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    let q = args.topic
      ? ctx.db.query("bugs").withIndex("by_topic", (qq) => qq.eq("topic", args.topic!))
      : ctx.db.query("bugs").withIndex("by_createdAt");
    // Apply optional filters
    if (args.status) {
      q = q.filter((qq) => qq.eq(qq.field("status"), args.status!));
    }
    if (args.severity) {
      q = q.filter((qq) => qq.eq(qq.field("severity"), args.severity!));
    }
    let bugs = await q.collect();
    // Sort newest first (by createdAt)
    bugs.sort((a, b) => b.createdAt - a.createdAt);
    const limit = args.limit ?? 50;
    return bugs.slice(0, limit);
  },
});

// Get bug with comments
export const getBugWithComments = query({
  args: { bugId: v.id("bugs") },
  returns: v.object({
    bug: v.object({
      _id: v.id("bugs"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      topic: v.string(),
      reporterId: v.optional(v.id("users")),
      status: statusValidator,
      severity: severityValidator,
      tags: v.optional(v.array(v.string())),
      maintainerNote: v.optional(v.string()),
      upvoters: v.optional(v.array(v.id("users"))),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    comments: v.array(
      v.object({
        _id: v.id("bugComments"),
        _creationTime: v.number(),
        bugId: v.id("bugs"),
        authorId: v.optional(v.id("users")),
        content: v.string(),
        createdAt: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const bug = await ctx.db.get(args.bugId);
    if (!bug) throw new Error("Bug not found");
    const comments = await ctx.db
      .query("bugComments")
      .withIndex("by_bug", (q) => q.eq("bugId", args.bugId))
      .collect();
    comments.sort((a, b) => a.createdAt - b.createdAt);
    return { bug, comments } as any;
  },
});

// Add a comment to a bug
export const addComment = mutation({
  args: {
    bugId: v.id("bugs"),
    authorId: v.optional(v.id("users")),
    content: v.string(),
  },
  returns: v.id("bugComments"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const commentId = await ctx.db.insert("bugComments", {
      bugId: args.bugId,
      authorId: args.authorId,
      content: args.content,
      createdAt: now,
    });
    await ctx.db.patch(args.bugId, { updatedAt: now });
    return commentId;
  },
});

// Update severity (staff only)
export const updateSeverity = mutation({
  args: { bugId: v.id("bugs"), severity: severityValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await isMaintainer(ctx))) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.bugId, { severity: args.severity, updatedAt: Date.now() });
    return null;
  },
});

// Update status (staff only)
export const updateStatus = mutation({
  args: { bugId: v.id("bugs"), status: statusValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await isMaintainer(ctx))) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.bugId, { status: args.status, updatedAt: Date.now() });
    return null;
  },
});

// Update maintainer note (staff only)
export const updateMaintainerNote = mutation({
  args: { bugId: v.id("bugs"), note: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await isMaintainer(ctx))) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.bugId, { maintainerNote: args.note, updatedAt: Date.now() });
    return null;
  },
});

// Toggle upvote for a bug
export const toggleUpvote = mutation({
  args: { bugId: v.id("bugs"), userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const bug = await ctx.db.get(args.bugId);
    if (!bug) throw new Error("Bug not found");
    const upvoters: Id<"users">[] = bug.upvoters || [];
    const has = upvoters.find((id) => id.toString() === args.userId.toString());
    let next: Id<"users">[];
    if (has) {
      next = upvoters.filter((id) => id.toString() !== args.userId.toString());
    } else {
      next = [...upvoters, args.userId];
    }
    await ctx.db.patch(args.bugId, { upvoters: next, updatedAt: Date.now() });
    return null;
  },
});

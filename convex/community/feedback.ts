import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

async function isMaintainer(ctx: any): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity?.();
  const privilegedClerkId = process.env.STAFF_CLERK_ID;
  const subject = identity?.subject || identity?.tokenIdentifier || null;
  if (subject && privilegedClerkId && subject === privilegedClerkId) return true;
  if (!identity?.subject) return false;
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkUserId", identity.subject))
    .first();
  if (!user) return false;
  if (user.overseeradmin) return true;
  if ((user as any).ecosystemdevs === true) return true;
  if ((user as any).role && (((user as any).role === "admin") || ((user as any).role === "staff"))) return true;
  return false;
}

export const isFeedbackMaintainer = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    return await isMaintainer(ctx);
  },
});

export const create = mutation({
  args: {
    topic: v.string(),
    overall: v.number(),
    comments: v.optional(v.string()),
    answers: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let userId: Id<"users"> | undefined = undefined;
    let clerkUserId: string | undefined = undefined;
    if (identity) {
      clerkUserId = identity.subject;
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
        .unique();
      if (user) userId = user._id as Id<"users">;
    }

    const id = await ctx.db.insert("feedback", {
      topic: args.topic,
      overall: args.overall,
      comments: args.comments,
      answers: args.answers,
      status: "new",
      userId,
      clerkUserId,
      votes: 0,
      voters: [],
      createdAt: Date.now(),
    } as any);
    return { _id: id } as const;
  },
});

export const updateTopic = mutation({
  args: { id: v.id("feedback"), topic: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await isMaintainer(ctx))) throw new Error("Not authorized");
    await ctx.db.patch(args.id, { topic: args.topic });
    return null;
  },
});

export const updateMaintainerNote = mutation({
  args: { id: v.id("feedback"), note: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await isMaintainer(ctx))) throw new Error("Not authorized");
    await ctx.db.patch(args.id, { maintainerNote: args.note });
    return null;
  },
});

export const deleteFeedback = mutation({
  args: { id: v.id("feedback") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Not found");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) throw new Error("Unauthorized");
    const maint = await isMaintainer(ctx);
    const isOwner = doc.userId && user._id && (doc.userId as any).toString?.() === (user._id as any).toString?.();
    if (!maint && !isOwner) throw new Error("Forbidden");
    await ctx.db.delete(args.id);
    return null;
  },
});

export const list = query({
  args: { topic: v.optional(v.string()), status: v.optional(v.union(v.literal("new"), v.literal("acknowledged"), v.literal("needs_info"), v.literal("resolved"), v.literal("closed"))) },
  handler: async (ctx, args) => {
    let items = [] as any[];
    if (args.topic) {
      items = await ctx.db.query("feedback").withIndex("by_topic", (q) => q.eq("topic", args.topic!)).collect();
    } else {
      items = await ctx.db.query("feedback").collect();
    }
    if (args.status) {
      items = items.filter((i) => i.status === args.status);
    }
    items.sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0) || (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return items;
  },
});

export const updateStatus = mutation({
  args: { id: v.id("feedback"), status: v.union(v.literal("new"), v.literal("acknowledged"), v.literal("needs_info"), v.literal("resolved"), v.literal("closed")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await isMaintainer(ctx))) throw new Error("Not authorized");
    await ctx.db.patch(args.id, { status: args.status });
    return null;
  },
});

export const voteUp = mutation({
  args: { id: v.id("feedback") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    const doc = await ctx.db.get(args.id);
    if (!doc) return false;
    // Prevent self-vote
    if (doc.clerkUserId && doc.clerkUserId === identity.subject) return false;
    const voters: string[] = Array.isArray(doc.voters) ? doc.voters : [];
    if (voters.includes(identity.subject)) return false;
    voters.push(identity.subject);
    await ctx.db.patch(args.id, { votes: Math.max(0, (doc.votes ?? 0) + 1), voters });
    return true;
  },
});

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
  if (user.isAdmin) return true;
  if ((user as any).ecosystemdevs === true) return true;
  if ((user as any).role && (((user as any).role === "admin") || ((user as any).role === "staff"))) return true;
  return false;
}

export const isFeatureMaintainer = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    return await isMaintainer(ctx);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    topic: v.string(),
    description: v.optional(v.string()),
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

    const id = await ctx.db.insert("features", {
      title: args.title,
      topic: args.topic,
      description: args.description,
      status: "open",
      userId,
      clerkUserId,
      votes: 0,
      voters: [],
      createdAt: Date.now(),
    } as any);
    return { _id: id } as const;
  },
});

export const updateStatus = mutation({
  args: { id: v.id("features"), status: v.union(v.literal("open"), v.literal("planned"), v.literal("in_progress"), v.literal("done"), v.literal("tabled")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await isMaintainer(ctx))) throw new Error("Not authorized");
    await ctx.db.patch(args.id, { status: args.status });
    return null;
  },
});

export const updateTopic = mutation({
  args: { id: v.id("features"), topic: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await isMaintainer(ctx))) throw new Error("Not authorized");
    await ctx.db.patch(args.id, { topic: args.topic });
    return null;
  },
});

export const updateMaintainerNote = mutation({
  args: { id: v.id("features"), note: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await isMaintainer(ctx))) throw new Error("Not authorized");
    await ctx.db.patch(args.id, { maintainerNote: args.note });
    return null;
  },
});

export const deleteFeature = mutation({
  args: { id: v.id("features") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const feature = await ctx.db.get(args.id);
    if (!feature) throw new Error("Not found");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) throw new Error("Unauthorized");
    const maint = await isMaintainer(ctx);
    const isOwner = feature.userId && user._id && (feature.userId as any).toString?.() === (user._id as any).toString?.();
    if (!maint && !isOwner) throw new Error("Forbidden");
    await ctx.db.delete(args.id);
    return null;
  },
});

export const list = query({
  args: { topic: v.optional(v.string()), status: v.optional(v.union(v.literal("open"), v.literal("planned"), v.literal("in_progress"), v.literal("done"), v.literal("tabled"))) },
  handler: async (ctx, args) => {
    let items = [] as any[];
    if (args.topic) {
      items = await ctx.db.query("features").withIndex("by_topic", (q) => q.eq("topic", args.topic!)).collect();
    } else {
      items = await ctx.db.query("features").collect();
    }
    if (args.status) {
      items = items.filter((i) => i.status === args.status);
    }
    items.sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0) || (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return items;
  },
});

// Comments
export const addFeatureComment = mutation({
  args: { parentId: v.id("features"), content: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const parent = await ctx.db.get(args.parentId);
    if (!parent) throw new Error("Not found");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    await ctx.db.insert("featureComments", {
      parentId: args.parentId,
      authorId: user?._id,
      clerkUserId: identity.subject,
      content: args.content,
      createdAt: Date.now(),
    } as any);
    return null;
  },
});

export const listFeatureComments = query({
  args: { parentId: v.id("features") },
  returns: v.array(
    v.object({
      _id: v.id("featureComments"),
      _creationTime: v.number(),
      parentId: v.id("features"),
      authorId: v.optional(v.id("users")),
      clerkUserId: v.optional(v.string()),
      content: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const comments = await ctx.db.query("featureComments").withIndex("by_parent", (q) => q.eq("parentId", args.parentId)).collect();
    comments.sort((a, b) => a.createdAt - b.createdAt);
    return comments as any;
  },
});

export const deleteFeatureComment = mutation({
  args: { id: v.id("featureComments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const c = await ctx.db.get(args.id);
    if (!c) throw new Error("Not found");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    const maint = await isMaintainer(ctx);
    const isOwner = (c as any).authorId && user?._id && String((c as any).authorId) === String(user._id);
    if (!maint && !isOwner) throw new Error("Forbidden");
    await ctx.db.delete(args.id);
    return null;
  },
});

export const voteUp = mutation({
  args: { id: v.id("features") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    const doc = await ctx.db.get(args.id);
    if (!doc) return false;
    if (doc.clerkUserId && doc.clerkUserId === identity.subject) return false;
    const voters: string[] = Array.isArray(doc.voters) ? doc.voters : [];
    if (voters.includes(identity.subject)) return false;
    voters.push(identity.subject);
    await ctx.db.patch(args.id, { votes: Math.max(0, (doc.votes ?? 0) + 1), voters });
    return true;
  },
});

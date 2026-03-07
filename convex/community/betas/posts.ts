import { query, mutation } from "../../_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("betaPosts")
      .withIndex("by_createdAt", (q) => q.gt("createdAt", 0))
      .order("desc")
      .collect();

    // Attach minimal author info
    const userIds = Array.from(new Set(posts.map((p) => p.userId)));
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const map = new Map(users.filter(Boolean).map((u: any) => [u._id, u]));

    return posts.map((p) => ({
      _id: p._id,
      userId: p.userId,
      topic: p.topic ?? null,
      content: p.content,
      createdAt: p.createdAt,
      author: map.get(p.userId) ? {
        displayName: (map.get(p.userId) as any).displayName,
        username: (map.get(p.userId) as any).username,
      } : null,
    }));
  },
});

export const create = mutation({
  args: {
    topic: v.optional(v.string()),
    content: v.string(),
  },
  handler: async (ctx, { topic, content }) => {
    const identity = await ctx.auth.getUserIdentity?.();
    if (!identity) throw new Error("Unauthorized");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();
    if (!me) throw new Error("User not found");
    if (!(me as any).ecosystemdevs) throw new Error("Forbidden");

    const now = Date.now();
    const id = await ctx.db.insert("betaPosts", {
      userId: me._id,
      topic: topic && topic.trim().length ? topic.trim() : undefined,
      content: content.trim(),
      createdAt: now,
    });
    return id;
  },
});

export const remove = mutation({
  args: { postId: v.id("betaPosts") },
  handler: async (ctx, { postId }) => {
    const identity = await ctx.auth.getUserIdentity?.();
    if (!identity) throw new Error("Unauthorized");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();
    if (!me) throw new Error("User not found");

    const post = await ctx.db.get(postId);
    if (!post) return null;
    if (post.userId !== me._id && !(me as any).ecosystemdevs) throw new Error("Forbidden");

    await ctx.db.delete(postId);
    return null;
  },
});

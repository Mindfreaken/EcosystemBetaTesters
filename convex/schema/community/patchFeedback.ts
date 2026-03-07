import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";

export const submitFeedback = mutation({
  args: {
    file: v.string(),
    overall: v.optional(v.number()),
    sectionRatings: v.optional(v.array(v.object({ section: v.string(), rating: v.number() }))),
    valuableSections: v.optional(v.array(v.string())),
    comments: v.optional(v.string()),
    clerkUserId: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let userId = args.userId;
    if (!userId && args.clerkUserId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
        .unique();
      if (user) userId = user._id;
    }

    const doc = {
      file: args.file,
      userId,
      overall: args.overall,
      sectionRatings: args.sectionRatings,
      valuableSections: args.valuableSections,
      comments: args.comments,
      createdAt: Date.now(),
    } as const;

    const id = await ctx.db.insert("patchFeedback", doc as any);
    return { _id: id };
  },
});

export const hasUserSubmitted = query({
  args: {
    file: v.string(),
    clerkUserId: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let userId = args.userId;
    if (!userId && args.clerkUserId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId!))
        .unique();
      if (user) userId = user._id;
    }

    if (!userId) return { submitted: false } as const;

    // Query by user first (uses index), then check the requested file
    const items = await ctx.db
      .query("patchFeedback")
      .withIndex("by_user", (q) => q.eq("userId", userId!))
      .collect();
    const submitted = items.some((it: any) => it.file === args.file);
    return { submitted } as const;
  },
});

export const listByFile = query({
  args: { file: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("patchFeedback")
      .withIndex("by_file", (q) => q.eq("file", args.file))
      .collect();
    return items;
  },
});

export const averagesByFile = query({
  args: { file: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("patchFeedback")
      .withIndex("by_file", (q) => q.eq("file", args.file))
      .collect();

    // Count unique users who submitted feedback
    const uniqueUserIds = new Set();
    items.forEach((item: any) => {
      if (item.userId) {
        uniqueUserIds.add(item.userId);
      }
    });
    const uniqueUserCount = uniqueUserIds.size;

    // Overall average: average of ALL numeric scores (explicit overall + each section rating)
    let overallSum = 0;
    let overallCount = 0;
    for (const it of items as Array<{ overall?: number; sectionRatings?: Array<{ section: string; rating: number }> }>) {
      if (typeof it.overall === "number") {
        overallSum += it.overall;
        overallCount += 1;
      }
      const list = it.sectionRatings || [];
      for (const { rating } of list) {
        if (typeof rating === 'number') {
          overallSum += rating;
          overallCount += 1;
        }
      }
    }
    const overall = {
      avg: overallCount ? overallSum / overallCount : null,
      count: overallCount,
    } as const;

    // Section/category averages
    const sectionAgg = new Map<string, { sum: number; count: number }>();
    const categoryAgg = new Map<string, { sum: number; count: number }>();
    for (const it of items as Array<{ sectionRatings?: Array<{ section: string; rating: number }> }>) {
      const list = it.sectionRatings || [];
      for (const { section, rating } of list) {
        if (typeof rating !== "number" || !section) continue;
        const curr = sectionAgg.get(section) || { sum: 0, count: 0 };
        curr.sum += rating;
        curr.count += 1;
        sectionAgg.set(section, curr);

        // Roll up by parent category (first word before space)
        const parent = section.split(/\s+/)[0];
        if (parent) {
          const c = categoryAgg.get(parent) || { sum: 0, count: 0 };
          c.sum += rating;
          c.count += 1;
          categoryAgg.set(parent, c);
        }
      }
    }
    const sections: Record<string, { avg: number | null; count: number }> = {};
    for (const [sec, { sum, count }] of sectionAgg.entries()) {
      sections[sec] = { avg: count ? sum / count : null, count };
    }
    const categories: Record<string, { avg: number | null; count: number }> = {};
    for (const [cat, { sum, count }] of categoryAgg.entries()) {
      categories[cat] = { avg: count ? sum / count : null, count };
    }

    return { overall, sections, categories, uniqueUserCount } as const;
  },
});

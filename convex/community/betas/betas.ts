import { query, mutation } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";

export const getCurrentBetaForUser = query({
  args: { userId: v.optional(v.id("users")) },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("betaAnnouncements"),
      title: v.string(),
      body: v.string(),
      link: v.optional(v.string()),
      betaNumber: v.number(),
      active: v.boolean(),
      createdAt: v.number(),
      startsAt: v.optional(v.number()),
      endsAt: v.optional(v.number()),
      dismissed: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    // Get all active betas; optionally filter by time window
    const now = Date.now();
    const candidates = (await ctx.db
      .query("betaAnnouncements")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect())
      .filter((b) => (b.startsAt ? b.startsAt <= now : true))
      .filter((b) => (b.endsAt ? b.endsAt >= now : true));

    if (candidates.length === 0) return null as any;

    // Prefer highest betaNumber, then most recent
    candidates.sort((a, b) => {
      if (b.betaNumber !== a.betaNumber) return b.betaNumber - a.betaNumber;
      return b.createdAt - a.createdAt;
    });

    const beta = candidates[0];

    let dismissed = false;
    if (args.userId) {
      const dismissal = await ctx.db
        .query("betaDismissals")
        .withIndex("by_user_beta", (q) => q.eq("userId", args.userId!).eq("betaId", beta._id))
        .first();
      dismissed = !!dismissal;
    }

    return {
      _id: beta._id,
      title: beta.title,
      body: beta.body,
      link: beta.link,
      betaNumber: beta.betaNumber,
      active: beta.active,
      createdAt: beta.createdAt,
      startsAt: beta.startsAt,
      endsAt: beta.endsAt,
      dismissed,
    } as any;
  },
});

export const dismissBeta = mutation({
  args: { betaId: v.id("betaAnnouncements"), userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, { betaId, userId }) => {
    const existing = await ctx.db
      .query("betaDismissals")
      .withIndex("by_user_beta", (q) => q.eq("userId", userId).eq("betaId", betaId))
      .first();
    if (!existing) {
      await ctx.db.insert("betaDismissals", {
        betaId,
        userId,
        dismissedAt: Date.now(),
      });
    }
    return null;
  },
});

export const recordBetaClick = mutation({
  args: { betaId: v.id("betaAnnouncements"), userId: v.optional(v.id("users")) },
  returns: v.null(),
  handler: async (ctx, { betaId, userId }) => {
    // For now, just log; can be expanded to analytics table later
    console.log("Beta clicked", { betaId: betaId.toString(), userId: userId?.toString() });
    return null;
  },
});

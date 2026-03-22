import { query } from "../../_generated/server";
import { v } from "convex/values";
import { ensureUser } from "../onboarding/onboarding"; // Ensure we get the properly authenticated user

export const getRecentActivities = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user) return null;

    const limit = args.limit ?? 20;

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return activities;
  },
});

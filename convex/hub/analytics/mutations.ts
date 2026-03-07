import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";

function fmtDayUTC(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fmtMonthUTC(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export const touch = mutation({
  args: { hub: v.string() },
  handler: async (ctx, { hub }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) return;

    const now = Date.now();
    const today = fmtDayUTC(new Date(now));
    const month = fmtMonthUTC(new Date(now));

    const existingDaily = await ctx.db
      .query("hubDailyActive")
      .withIndex("by_day_user", (q) => q.eq("hub", hub).eq("day", today).eq("userId", user._id))
      .unique();
    if (!existingDaily) {
      await ctx.db.insert("hubDailyActive", {
        hub,
        userId: user._id,
        day: today,
        createdAt: now,
      });
    }

    const existingMonthly = await ctx.db
      .query("hubMonthlyActive")
      .withIndex("by_month_user", (q) => q.eq("hub", hub).eq("month", month).eq("userId", user._id))
      .unique();
    if (!existingMonthly) {
      await ctx.db.insert("hubMonthlyActive", {
        hub,
        userId: user._id,
        month,
        createdAt: now,
      });
    }
  },
});

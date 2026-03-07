import { query } from "../../_generated/server";
import { v } from "convex/values";

export const getCounts = query({
  args: { hub: v.string() },
  returns: v.object({ dau: v.number(), mau: v.number() }),
  handler: async (ctx, { hub }) => {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, "0");
    const d = String(now.getUTCDate()).padStart(2, "0");
    const day = `${y}-${m}-${d}`;
    const month = `${y}-${m}`;

    const todayDocs = await ctx.db
      .query("hubDailyActive")
      .withIndex("by_day", (q) => q.eq("hub", hub).eq("day", day))
      .collect();

    const monthDocs = await ctx.db
      .query("hubMonthlyActive")
      .withIndex("by_month", (q) => q.eq("hub", hub).eq("month", month))
      .collect();

    return { dau: todayDocs.length, mau: monthDocs.length };
  },
});

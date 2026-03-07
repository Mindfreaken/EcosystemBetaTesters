import { mutation } from "../../_generated/server";
import { v } from "convex/values";

export const checkWords = mutation({
  args: { words: v.array(v.string()) },
  handler: async (ctx, { words }) => {
    const result: Record<string, boolean> = {};
    for (const raw of words) {
      const w = raw.trim().toLowerCase();
      if (!w || !/^[a-z]+$/.test(w)) {
        result[raw] = false;
        continue;
      }
      const existing = await ctx.db
        .query("englishWords")
        .withIndex("by_word", (q) => q.eq("word", w))
        .first();
      result[raw] = !!existing;
    }
    return result;
  },
});

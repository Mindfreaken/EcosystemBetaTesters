import { action } from "../../_generated/server";
import { v } from "convex/values";
import { api } from "../../_generated/api";

export const ingest = action({
  args: {
    entries: v.array(
      v.object({
        game: v.string(),
        period: v.string(),
        date: v.string(), // YYYY-MM-DD
        wordId: v.number(),
        displayName: v.string(),
      })
    ),
    replace: v.optional(v.boolean()),
    chunkSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const chunkSize = Math.max(1, Math.min(args.chunkSize ?? 1000, 5000));
    let total = 0;
    for (let i = 0; i < args.entries.length; i += chunkSize) {
      const batch = args.entries.slice(i, i + chunkSize);
      const inserted = await ctx.runMutation(api.dailies.nerdle.schedules.upsertMany, {
        entries: batch,
        replace: i === 0 ? args.replace : false,
      });
      total += inserted;
    }
    return { inserted: total, batches: Math.ceil(args.entries.length / chunkSize) };
  },
});

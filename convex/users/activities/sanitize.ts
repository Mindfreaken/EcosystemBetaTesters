import { mutation, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { stripIds } from "./helpers";

// Internal backfill to sanitize all activities
export const sanitizeAllActivityDescriptions = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({ updated: v.number(), scanned: v.number() }),
  handler: async (ctx, { dryRun }) => {
    const all = await ctx.db.query("activities").collect();
    let updated = 0;

    for (const a of all) {
      const clean = stripIds(a.description ?? undefined);
      if (clean !== a.description) {
        if (!dryRun) {
          await ctx.db.patch(a._id, { description: clean });
        }
        updated++;
      }
    }

    return { updated, scanned: all.length };
  },
});

// Public wrapper callable from dashboard/client
export const sanitizeActivities = mutation({
  args: { confirm: v.boolean() },
  returns: v.object({ updated: v.number(), scanned: v.number() }),
  handler: async (ctx, { confirm }) => {
    if (!confirm) {
      throw new Error("Pass confirm: true to run sanitizer");
    }
    const all = await ctx.db.query("activities").collect();
    let updated = 0;
    for (const a of all) {
      const clean = stripIds(a.description ?? undefined);
      if (clean !== a.description) {
        await ctx.db.patch(a._id, { description: clean });
        updated++;
      }
    }
    return { updated, scanned: all.length };
  },
});

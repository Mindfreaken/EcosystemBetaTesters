import { v } from "convex/values";
import { action, mutation } from "../../_generated/server";
import { api } from "../../_generated/api";

export const upsertWords = mutation({
  args: {
    words: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const inserted: string[] = [];
    const skippedExisting: string[] = [];
    const skippedInvalid: string[] = [];

    for (const raw of args.words) {
      const word = raw.trim();
      if (!word) {
        continue;
      }
      if (!/^[a-z]+$/.test(word)) {
        skippedInvalid.push(word);
        continue;
      }
      if (word.length < 1 || word.length > 32) {
        skippedInvalid.push(word);
        continue;
      }

      const existing = await ctx.db
        .query("englishWords")
        .withIndex("by_word", q => q.eq("word", word))
        .first();
      if (existing) {
        skippedExisting.push(word);
        continue;
      }

      await ctx.db.insert("englishWords", { word });
      inserted.push(word);
    }

    return {
      insertedCount: inserted.length,
      skippedExistingCount: skippedExisting.length,
      skippedInvalidCount: skippedInvalid.length,
    } as const;
  },
});

export const ingest = action({
  args: {
    words: v.array(v.string()),
    chunkSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const chunkSize = Math.max(1, Math.min(args.chunkSize ?? 1000, 3000));

    const batches: string[][] = [];
    for (let i = 0; i < args.words.length; i += chunkSize) {
      batches.push(args.words.slice(i, i + chunkSize));
    }

    let inserted = 0;
    let skippedExisting = 0;
    let skippedInvalid = 0;

    for (const batch of batches) {
      const res = await ctx.runMutation(api.dailies.nerdle.ingestCorpus.upsertWords, { words: batch });
      inserted += res.insertedCount;
      skippedExisting += res.skippedExistingCount;
      skippedInvalid += res.skippedInvalidCount;
    }

    return {
      batches: batches.length,
      inserted,
      skippedExisting,
      skippedInvalid,
    } as const;
  },
});

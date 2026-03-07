import { v } from "convex/values";
import { action } from "../../_generated/server";

// Minimal stub for Riot LoL ingest action to satisfy generated API path:
// api.riot.league.ingest.ingestMatchById
export const ingestMatchById = action({
  args: { matchId: v.string() },
  handler: async (ctx, { matchId }) => {
    // TODO: Implement real ingestion logic
    // For now, return a simple payload so callers have a predictable shape
    return { ok: true, ingested: false, matchId } as const;
  },
});

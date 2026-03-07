import { v } from "convex/values";
import { query } from "../../_generated/server";

// Minimal stub for Riot LoL matches query to satisfy generated API path:
// api.riot.league.matches.getMatchBundle
export const getMatchBundle = query({
  args: { matchId: v.string() },
  handler: async (_ctx, { matchId }) => {
    // TODO: Implement real fetch from stored collections
    return { matchId, data: null } as const;
  },
});

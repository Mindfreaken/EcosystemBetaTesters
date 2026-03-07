import { internalAction } from "../../_generated/server";

// Minimal stub for Riot LoL controller tick to satisfy path:
// internal.riot.league.control.tick
export const tick = internalAction({
  args: {},
  handler: async (_ctx, _args) => {
    // TODO: Implement controller orchestration logic
    return { ok: true } as const;
  },
});

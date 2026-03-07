import { internal } from "../../_generated/api";

// Register the single orchestrator cron for League of Legends control
// This replaces feature-specific LoL crons and only triggers the controller tick.
export function register(crons: ReturnType<typeof import("convex/server").cronJobs>) {
  // The orchestrator tick is a lightweight driver that reads controller state
  // and enqueues the next bounded work step. It will no-op when the controller
  // is stopped or paused.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - API path available after Convex codegen
  crons.interval(
    "lol-control-tick",
    { minutes: 1 },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    internal.riot.league.control.tick,
    {}
  );
}

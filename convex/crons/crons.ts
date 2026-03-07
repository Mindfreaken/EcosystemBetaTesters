// DEPRECATED: This file was a legacy cron entrypoint and can cause duplicate scheduling.
// It now re-exports the root cron configuration from `convex/crons.ts`.
// Prefer importing from `convex/crons.ts` only.
import crons from "../crons";
export default crons;

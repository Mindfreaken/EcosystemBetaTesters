import { internal } from "../_generated/api";

// Register overseer-related cron jobs
export function register(crons: ReturnType<typeof import("convex/server").cronJobs>) {
    // Legacy cron job removed: Reports are now resolved immediately on castVote.
}

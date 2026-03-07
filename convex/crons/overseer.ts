import { internal } from "../_generated/api";

// Register overseer-related cron jobs
export function register(crons: ReturnType<typeof import("convex/server").cronJobs>) {
    crons.interval(
        "resolve_overseer_reports",
        { minutes: 60 },
        internal.hub.overseer.resolvePendingReports
    );
}

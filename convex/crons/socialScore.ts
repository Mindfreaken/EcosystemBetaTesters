import { internal } from "../_generated/api";

// Register social score restoration cron
export function register(crons: ReturnType<typeof import("convex/server").cronJobs>) {
  // Run daily to restore social scores for users who have gone 30 days without punishments
  crons.interval(
    "restore-social-scores",
    { hours: 24 },
    internal.users.profiles.functions.socialScore.scheduleScoreRestorations.scheduleScoreRestorations,
    {}
  );
}

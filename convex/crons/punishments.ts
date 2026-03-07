import { internal } from "../_generated/api";

// Register punishments-related cron jobs
export function register(crons: ReturnType<typeof import("convex/server").cronJobs>) {
  // Run monthly (on the 1st) to check for users exceeding punishment limits and reset them
  crons.cron(
    "check-punishment-limits",
    "0 0 1 * *", // At midnight on the 1st day of each month
    internal.community.punishmentLimits.checkAndResetMonthlyLimits,
    {}
  );

  // Run nightly at midnight to expire ended punishments and restore points
  crons.cron(
    "expire-ended-punishments",
    "0 0 * * *", // Every day at 00:00 UTC (Convex server time)
    internal.community.punishments.expireEndedPunishments,
    {}
  );
}

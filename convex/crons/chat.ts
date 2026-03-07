import { internal } from "../_generated/api";

// Register chat-related cron jobs
export function register(crons: ReturnType<typeof import("convex/server").cronJobs>) {
  // Run weekly to clean up old DM chats between non-friends
  crons.interval(
    "cleanup-old-dm-chats",
    { hours: 168 },
    internal.chat.functions.dm.cleanupOldDmChats,
    { olderThanDays: 30 }
  );
}

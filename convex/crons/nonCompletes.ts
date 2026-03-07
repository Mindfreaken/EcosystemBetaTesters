import { internal } from "../_generated/api";

// Register non-completes daily processor
export function register(crons: ReturnType<typeof import("convex/server").cronJobs>) {
  // Process non-completes daily at 00:05 UTC
  crons.daily(
    "processNonCompletes",
    { hourUTC: 0, minuteUTC: 5 },
    // @ts-ignore - this path exists after Convex codegen updates the API
    internal.crons.markNonCompletes.processNonCompletes,
    {}
  );
}

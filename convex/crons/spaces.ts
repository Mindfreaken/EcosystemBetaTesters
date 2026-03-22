import { internal } from "../_generated/api";

export function register(crons: any) {
  crons.hourly(
    "process-spaces-downgrades",
    { minuteUTC: 0 },
    internal.spaces.downgrade.processDowngrades
  );
}

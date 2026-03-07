import { chatReportTables } from "./reports/chatReports";
import { overseerVoteTables } from "./reports/overseerVotes";

// Aggregated Reports domain tables
export const reportsTables = {
  ...chatReportTables,
  ...overseerVoteTables,
} as const;

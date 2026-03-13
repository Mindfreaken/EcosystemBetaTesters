import { chatReportTables } from "./reports/chatReports";
import { overseerVoteTables } from "./reports/overseerVotes";
import { appealTables } from "./reports/appeals";

// Aggregated Reports domain tables
export const reportsTables = {
  ...chatReportTables,
  ...overseerVoteTables,
  ...appealTables,
} as const;

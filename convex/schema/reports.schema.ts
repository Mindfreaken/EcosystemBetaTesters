import { chatReportTables } from "./reports/chatReports";
import { appealTables } from "./reports/appeals";

// Aggregated Reports domain tables
export const reportsTables = {
  ...chatReportTables,
  ...appealTables,
} as const;

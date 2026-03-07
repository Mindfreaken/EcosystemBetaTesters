import { nerdleTables } from "./dailies/nerdle/nerdle";
import { dungeonDealTables } from "./dailies/dungeonDeal/dungeonDeal";

// Aggregated Games domain tables
export const gameTables = {
  ...nerdleTables,
  ...dungeonDealTables,
} as const;
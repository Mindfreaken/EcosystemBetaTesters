import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { communityTables } from "./schema/community.schema";
import { gameTables } from "./schema/dailies.schema";
import { chatTables } from "./schema/chat.schema";
import { reportsTables } from "./schema/reports.schema";
import { usersTables } from "./schema/users.schema";
import { fileTables } from "./schema/files.schema";
import { leagueTables } from "./schema/league.schema";
import { analyticsTables } from "./schema/analytics.schema";
import { spacesTables } from "./schema/spaces";

export default defineSchema({
  // Games
  ...gameTables,
  // Community modules
  ...communityTables,
  // Chat domain
  ...chatTables,
  // Reports domain
  ...reportsTables,
  // Users domain
  ...usersTables,
  // League schema stays the single aggregation point
  ...leagueTables,
  // Files domain
  ...fileTables,
  // Analytics domain (presence, DAU/MAU)
  ...analyticsTables,
  // Spaces domain
  ...spacesTables,

});
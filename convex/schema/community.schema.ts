import { communityPatchNotesTables } from "./community/patchnotes";
import { punishmentTables } from "./community/moderation/punishments";
// Aggregated Community domain tables
export const communityTables = {
  ...communityPatchNotesTables,
  ...punishmentTables,
} as const;

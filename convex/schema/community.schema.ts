import { communityBugTables } from "./community/bugs";
import { communityPatchNotesTables } from "./community/patchnotes";
import { communityBetaTables } from "./community/beta";
import { punishmentTables } from "./community/moderation/punishments";
import { communityFeedbackTables } from "./community/feedback";
import { communityFeatureTables } from "./community/features";
import { communityAnnouncementTables } from "./community/announcements";

// Aggregated Community domain tables
export const communityTables = {
  ...communityBugTables,
  ...communityPatchNotesTables,
  ...communityBetaTables,
  ...punishmentTables,
  ...communityFeedbackTables,
  ...communityFeatureTables,
  ...communityAnnouncementTables,
} as const;

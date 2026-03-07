import { usersCoreTables } from "./users/core/users";
import { userAchievementTables } from "./users/achievements/achievements";
import { userActivityTables } from "./users/activity/activities";
import { userFollowTables } from "./users/relationships/follows";
import { userFriendRequestTables } from "./users/relationships/friendRequests";
import { userFriendshipTables } from "./users/relationships/friendships";
import { userFriendTables } from "./users/relationships/friends";
import { userFriendCodeTables } from "./users/relationships/friendCodes";
import { userSocialScoreTables } from "./users/scores/socialScores";
import { userProfileTypeTables } from "./users/profiles/profileTypes";
import { userProfileSnapshotTables } from "./users/profiles/profileSnapshots";
import { userSettingTables } from "./users/settings/settings";
import { userThemeVoteTables } from "./users/settings/themeVotes";
import { userCounterTables } from "./users/counters";
import { userSystemParameterTables } from "./users/settings/systemParameters";
import { suspensionTables } from "./users/suspensions";

export const usersTables = {
  ...usersCoreTables,
  ...userAchievementTables,
  ...userActivityTables,
  ...userFollowTables,
  ...userFriendRequestTables,
  ...userFriendTables,
  ...userFriendshipTables,
  ...userFriendCodeTables,
  ...userSocialScoreTables,
  ...userProfileTypeTables,
  ...userProfileSnapshotTables,
  ...userSettingTables,
  ...userThemeVoteTables,
  ...userCounterTables,
  ...userSystemParameterTables,
  ...suspensionTables,
} as const;


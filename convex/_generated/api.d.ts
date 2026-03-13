/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth_helpers from "../auth/helpers.js";
import type * as chat_attachments_helpers from "../chat/attachments/helpers.js";
import type * as chat_functions_attachments from "../chat/functions/attachments.js";
import type * as chat_functions_chats from "../chat/functions/chats.js";
import type * as chat_functions_dm from "../chat/functions/dm.js";
import type * as chat_functions_files from "../chat/functions/files.js";
import type * as chat_functions_index from "../chat/functions/index.js";
import type * as chat_functions_keys from "../chat/functions/keys.js";
import type * as chat_functions_messages from "../chat/functions/messages.js";
import type * as chat_functions_reports from "../chat/functions/reports.js";
import type * as chat_functions_welcome from "../chat/functions/welcome.js";
import type * as chat_lib_permissions from "../chat/lib/permissions.js";
import type * as chat_storage from "../chat/storage.js";
import type * as community_announcements_posts from "../community/announcements/posts.js";
import type * as community_betas_betas from "../community/betas/betas.js";
import type * as community_betas_posts from "../community/betas/posts.js";
import type * as community_bugs_bugs from "../community/bugs/bugs.js";
import type * as community_features from "../community/features.js";
import type * as community_feedback from "../community/feedback.js";
import type * as community_punishmentLimits from "../community/punishmentLimits.js";
import type * as community_punishments from "../community/punishments.js";
import type * as community_reports from "../community/reports.js";
import type * as community_themeVotes from "../community/themeVotes.js";
import type * as crons from "../crons.js";
import type * as crons_chat from "../crons/chat.js";
import type * as crons_crons from "../crons/crons.js";
import type * as crons_lolControl_index from "../crons/lolControl/index.js";
import type * as crons_nonCompletes from "../crons/nonCompletes.js";
import type * as crons_overseer from "../crons/overseer.js";
import type * as crons_punishments from "../crons/punishments.js";
import type * as crons_socialScore from "../crons/socialScore.js";
import type * as dailies_nerdle_current from "../dailies/nerdle/current.js";
import type * as dailies_nerdle_ingestCorpus from "../dailies/nerdle/ingestCorpus.js";
import type * as dailies_nerdle_leaderboard from "../dailies/nerdle/leaderboard.js";
import type * as dailies_nerdle_plays from "../dailies/nerdle/plays.js";
import type * as dailies_nerdle_schedules from "../dailies/nerdle/schedules.js";
import type * as dailies_nerdle_schedulesIngest from "../dailies/nerdle/schedulesIngest.js";
import type * as dailies_nerdle_words from "../dailies/nerdle/words.js";
import type * as dev_setupAdmin from "../dev/setupAdmin.js";
import type * as http from "../http.js";
import type * as hub_analytics_mutations from "../hub/analytics/mutations.js";
import type * as hub_analytics_queries from "../hub/analytics/queries.js";
import type * as hub_overseer from "../hub/overseer.js";
import type * as lib_admin from "../lib/admin.js";
import type * as lib_permissions_utils from "../lib/permissions_utils.js";
import type * as lib_withStatus from "../lib/withStatus.js";
import type * as riot_league_control from "../riot/league/control.js";
import type * as riot_league_ingest from "../riot/league/ingest.js";
import type * as riot_league_matches from "../riot/league/matches.js";
import type * as schema_chat_attachments from "../schema/chat/attachments.js";
import type * as schema_chat_chats from "../schema/chat/chats.js";
import type * as schema_chat_deletes from "../schema/chat/deletes.js";
import type * as schema_chat_edits from "../schema/chat/edits.js";
import type * as schema_chat_keys from "../schema/chat/keys.js";
import type * as schema_chat_messages from "../schema/chat/messages.js";
import type * as schema_chat_reactions from "../schema/chat/reactions.js";
import type * as schema_chat_readReceipts from "../schema/chat/readReceipts.js";
import type * as schema_chat_reports from "../schema/chat/reports.js";
import type * as schema_chat_tasks from "../schema/chat/tasks.js";
import type * as schema_community_announcements from "../schema/community/announcements.js";
import type * as schema_community_beta from "../schema/community/beta.js";
import type * as schema_community_bugs from "../schema/community/bugs.js";
import type * as schema_community_features from "../schema/community/features.js";
import type * as schema_community_feedback from "../schema/community/feedback.js";
import type * as schema_community_moderation_punishments from "../schema/community/moderation/punishments.js";
import type * as schema_community_patchFeedback from "../schema/community/patchFeedback.js";
import type * as schema_community_patchnotes from "../schema/community/patchnotes.js";
import type * as schema_dailies_dungeonDeal_dungeonDeal from "../schema/dailies/dungeonDeal/dungeonDeal.js";
import type * as schema_dailies_nerdle_nerdle from "../schema/dailies/nerdle/nerdle.js";
import type * as schema_dailies_nerdle_nerdleLeaderboard from "../schema/dailies/nerdle/nerdleLeaderboard.js";
import type * as schema_reports_appeals from "../schema/reports/appeals.js";
import type * as schema_reports_chatReports from "../schema/reports/chatReports.js";
import type * as schema_reports_overseerVotes from "../schema/reports/overseerVotes.js";
import type * as schema_riot_valorant_valorant from "../schema/riot/valorant/valorant.js";
import type * as schema_spaces from "../schema/spaces.js";
import type * as schema_users_achievements_achievements from "../schema/users/achievements/achievements.js";
import type * as schema_users_achievements_validators from "../schema/users/achievements/validators.js";
import type * as schema_users_activity_activities from "../schema/users/activity/activities.js";
import type * as schema_users_activity_validators from "../schema/users/activity/validators.js";
import type * as schema_users_core_users from "../schema/users/core/users.js";
import type * as schema_users_counters from "../schema/users/counters.js";
import type * as schema_users_profiles_profileSnapshots from "../schema/users/profiles/profileSnapshots.js";
import type * as schema_users_profiles_profileTypes from "../schema/users/profiles/profileTypes.js";
import type * as schema_users_profiles_profiles from "../schema/users/profiles/profiles.js";
import type * as schema_users_relationships_follows from "../schema/users/relationships/follows.js";
import type * as schema_users_relationships_friendCodes from "../schema/users/relationships/friendCodes.js";
import type * as schema_users_relationships_friendRequests from "../schema/users/relationships/friendRequests.js";
import type * as schema_users_relationships_friends from "../schema/users/relationships/friends.js";
import type * as schema_users_relationships_friendships from "../schema/users/relationships/friendships.js";
import type * as schema_users_scores_socialScores from "../schema/users/scores/socialScores.js";
import type * as schema_users_settings_settings from "../schema/users/settings/settings.js";
import type * as schema_users_settings_systemParameters from "../schema/users/settings/systemParameters.js";
import type * as schema_users_settings_themeVotes from "../schema/users/settings/themeVotes.js";
import type * as schema_users_suspensions from "../schema/users/suspensions.js";
import type * as seed from "../seed.js";
import type * as spaces_analytics from "../spaces/analytics.js";
import type * as spaces_audit from "../spaces/audit.js";
import type * as spaces_channels from "../spaces/channels.js";
import type * as spaces_constants from "../spaces/constants.js";
import type * as spaces_core from "../spaces/core.js";
import type * as spaces_emojis from "../spaces/emojis.js";
import type * as spaces_invites from "../spaces/invites.js";
import type * as spaces_members from "../spaces/members.js";
import type * as spaces_messages from "../spaces/messages.js";
import type * as spaces_moderation from "../spaces/moderation.js";
import type * as spaces_notes from "../spaces/notes.js";
import type * as spaces_polls from "../spaces/polls.js";
import type * as spaces_roles from "../spaces/roles.js";
import type * as spaces_rules from "../spaces/rules.js";
import type * as spaces_schedule from "../spaces/schedule.js";
import type * as spaces_voice from "../spaces/voice.js";
import type * as spaces_voiceToken from "../spaces/voiceToken.js";
import type * as spaces_welcome from "../spaces/welcome.js";
import type * as users_achievements_achievementDefs from "../users/achievements/achievementDefs.js";
import type * as users_achievements_core from "../users/achievements/core.js";
import type * as users_achievements_helpers from "../users/achievements/helpers.js";
import type * as users_achievements_migrations from "../users/achievements/migrations.js";
import type * as users_achievements_mutations from "../users/achievements/mutations.js";
import type * as users_achievements_queries from "../users/achievements/queries.js";
import type * as users_achievements_sync from "../users/achievements/sync.js";
import type * as users_achievements_system from "../users/achievements/system.js";
import type * as users_achievements_types from "../users/achievements/types.js";
import type * as users_activities_helpers from "../users/activities/helpers.js";
import type * as users_activities_sanitize from "../users/activities/sanitize.js";
import type * as users_friends_functions_addFriendByCode from "../users/friends/functions/addFriendByCode.js";
import type * as users_friends_functions_generateNewCode from "../users/friends/functions/generateNewCode.js";
import type * as users_friends_functions_getActiveCode from "../users/friends/functions/getActiveCode.js";
import type * as users_friends_functions_getFriendRequests from "../users/friends/functions/getFriendRequests.js";
import type * as users_friends_functions_getFriends from "../users/friends/functions/getFriends.js";
import type * as users_friends_functions_getFriendship from "../users/friends/functions/getFriendship.js";
import type * as users_friends_functions_respondToFriendRequest from "../users/friends/functions/respondToFriendRequest.js";
import type * as users_friends_functions_toggleFriendFavorite from "../users/friends/functions/toggleFriendFavorite.js";
import type * as users_friends_functions_toggleFriendMute from "../users/friends/functions/toggleFriendMute.js";
import type * as users_friends_functions_updateFriendStatus from "../users/friends/functions/updateFriendStatus.js";
import type * as users_friends_functions_useFriendCode from "../users/friends/functions/useFriendCode.js";
import type * as users_friends_utils from "../users/friends/utils.js";
import type * as users_onboarding_counters from "../users/onboarding/counters.js";
import type * as users_onboarding_onboarding from "../users/onboarding/onboarding.js";
import type * as users_onboarding_queries from "../users/onboarding/queries.js";
import type * as users_onboarding_storage from "../users/onboarding/storage.js";
import type * as users_onboarding_validation from "../users/onboarding/validation.js";
import type * as users_profiles_functions_following_followUser from "../users/profiles/functions/following/followUser.js";
import type * as users_profiles_functions_following_getFollowCount from "../users/profiles/functions/following/getFollowCount.js";
import type * as users_profiles_functions_following_getFollowStatus from "../users/profiles/functions/following/getFollowStatus.js";
import type * as users_profiles_functions_following_unfollowuser from "../users/profiles/functions/following/unfollowuser.js";
import type * as users_profiles_functions_profileOverview from "../users/profiles/functions/profileOverview.js";
import type * as users_profiles_functions_profileTypes from "../users/profiles/functions/profileTypes.js";
import type * as users_profiles_functions_socialScore_getSocialScore from "../users/profiles/functions/socialScore/getSocialScore.js";
import type * as users_profiles_functions_socialScore_initializeSocialScores from "../users/profiles/functions/socialScore/initializeSocialScores.js";
import type * as users_profiles_functions_socialScore_scheduleScoreRestorations from "../users/profiles/functions/socialScore/scheduleScoreRestorations.js";
import type * as users_profiles_functions_socialScore_socialScore from "../users/profiles/functions/socialScore/socialScore.js";
import type * as users_profiles_functions_updateProfile from "../users/profiles/functions/updateProfile.js";
import type * as users_profiles_snapshots from "../users/profiles/snapshots.js";
import type * as users_profiles_types_index from "../users/profiles/types/index.js";
import type * as users_settings from "../users/settings.js";
import type * as users_suspensionFunctions from "../users/suspensionFunctions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "auth/helpers": typeof auth_helpers;
  "chat/attachments/helpers": typeof chat_attachments_helpers;
  "chat/functions/attachments": typeof chat_functions_attachments;
  "chat/functions/chats": typeof chat_functions_chats;
  "chat/functions/dm": typeof chat_functions_dm;
  "chat/functions/files": typeof chat_functions_files;
  "chat/functions/index": typeof chat_functions_index;
  "chat/functions/keys": typeof chat_functions_keys;
  "chat/functions/messages": typeof chat_functions_messages;
  "chat/functions/reports": typeof chat_functions_reports;
  "chat/functions/welcome": typeof chat_functions_welcome;
  "chat/lib/permissions": typeof chat_lib_permissions;
  "chat/storage": typeof chat_storage;
  "community/announcements/posts": typeof community_announcements_posts;
  "community/betas/betas": typeof community_betas_betas;
  "community/betas/posts": typeof community_betas_posts;
  "community/bugs/bugs": typeof community_bugs_bugs;
  "community/features": typeof community_features;
  "community/feedback": typeof community_feedback;
  "community/punishmentLimits": typeof community_punishmentLimits;
  "community/punishments": typeof community_punishments;
  "community/reports": typeof community_reports;
  "community/themeVotes": typeof community_themeVotes;
  crons: typeof crons;
  "crons/chat": typeof crons_chat;
  "crons/crons": typeof crons_crons;
  "crons/lolControl/index": typeof crons_lolControl_index;
  "crons/nonCompletes": typeof crons_nonCompletes;
  "crons/overseer": typeof crons_overseer;
  "crons/punishments": typeof crons_punishments;
  "crons/socialScore": typeof crons_socialScore;
  "dailies/nerdle/current": typeof dailies_nerdle_current;
  "dailies/nerdle/ingestCorpus": typeof dailies_nerdle_ingestCorpus;
  "dailies/nerdle/leaderboard": typeof dailies_nerdle_leaderboard;
  "dailies/nerdle/plays": typeof dailies_nerdle_plays;
  "dailies/nerdle/schedules": typeof dailies_nerdle_schedules;
  "dailies/nerdle/schedulesIngest": typeof dailies_nerdle_schedulesIngest;
  "dailies/nerdle/words": typeof dailies_nerdle_words;
  "dev/setupAdmin": typeof dev_setupAdmin;
  http: typeof http;
  "hub/analytics/mutations": typeof hub_analytics_mutations;
  "hub/analytics/queries": typeof hub_analytics_queries;
  "hub/overseer": typeof hub_overseer;
  "lib/admin": typeof lib_admin;
  "lib/permissions_utils": typeof lib_permissions_utils;
  "lib/withStatus": typeof lib_withStatus;
  "riot/league/control": typeof riot_league_control;
  "riot/league/ingest": typeof riot_league_ingest;
  "riot/league/matches": typeof riot_league_matches;
  "schema/chat/attachments": typeof schema_chat_attachments;
  "schema/chat/chats": typeof schema_chat_chats;
  "schema/chat/deletes": typeof schema_chat_deletes;
  "schema/chat/edits": typeof schema_chat_edits;
  "schema/chat/keys": typeof schema_chat_keys;
  "schema/chat/messages": typeof schema_chat_messages;
  "schema/chat/reactions": typeof schema_chat_reactions;
  "schema/chat/readReceipts": typeof schema_chat_readReceipts;
  "schema/chat/reports": typeof schema_chat_reports;
  "schema/chat/tasks": typeof schema_chat_tasks;
  "schema/community/announcements": typeof schema_community_announcements;
  "schema/community/beta": typeof schema_community_beta;
  "schema/community/bugs": typeof schema_community_bugs;
  "schema/community/features": typeof schema_community_features;
  "schema/community/feedback": typeof schema_community_feedback;
  "schema/community/moderation/punishments": typeof schema_community_moderation_punishments;
  "schema/community/patchFeedback": typeof schema_community_patchFeedback;
  "schema/community/patchnotes": typeof schema_community_patchnotes;
  "schema/dailies/dungeonDeal/dungeonDeal": typeof schema_dailies_dungeonDeal_dungeonDeal;
  "schema/dailies/nerdle/nerdle": typeof schema_dailies_nerdle_nerdle;
  "schema/dailies/nerdle/nerdleLeaderboard": typeof schema_dailies_nerdle_nerdleLeaderboard;
  "schema/reports/appeals": typeof schema_reports_appeals;
  "schema/reports/chatReports": typeof schema_reports_chatReports;
  "schema/reports/overseerVotes": typeof schema_reports_overseerVotes;
  "schema/riot/valorant/valorant": typeof schema_riot_valorant_valorant;
  "schema/spaces": typeof schema_spaces;
  "schema/users/achievements/achievements": typeof schema_users_achievements_achievements;
  "schema/users/achievements/validators": typeof schema_users_achievements_validators;
  "schema/users/activity/activities": typeof schema_users_activity_activities;
  "schema/users/activity/validators": typeof schema_users_activity_validators;
  "schema/users/core/users": typeof schema_users_core_users;
  "schema/users/counters": typeof schema_users_counters;
  "schema/users/profiles/profileSnapshots": typeof schema_users_profiles_profileSnapshots;
  "schema/users/profiles/profileTypes": typeof schema_users_profiles_profileTypes;
  "schema/users/profiles/profiles": typeof schema_users_profiles_profiles;
  "schema/users/relationships/follows": typeof schema_users_relationships_follows;
  "schema/users/relationships/friendCodes": typeof schema_users_relationships_friendCodes;
  "schema/users/relationships/friendRequests": typeof schema_users_relationships_friendRequests;
  "schema/users/relationships/friends": typeof schema_users_relationships_friends;
  "schema/users/relationships/friendships": typeof schema_users_relationships_friendships;
  "schema/users/scores/socialScores": typeof schema_users_scores_socialScores;
  "schema/users/settings/settings": typeof schema_users_settings_settings;
  "schema/users/settings/systemParameters": typeof schema_users_settings_systemParameters;
  "schema/users/settings/themeVotes": typeof schema_users_settings_themeVotes;
  "schema/users/suspensions": typeof schema_users_suspensions;
  seed: typeof seed;
  "spaces/analytics": typeof spaces_analytics;
  "spaces/audit": typeof spaces_audit;
  "spaces/channels": typeof spaces_channels;
  "spaces/constants": typeof spaces_constants;
  "spaces/core": typeof spaces_core;
  "spaces/emojis": typeof spaces_emojis;
  "spaces/invites": typeof spaces_invites;
  "spaces/members": typeof spaces_members;
  "spaces/messages": typeof spaces_messages;
  "spaces/moderation": typeof spaces_moderation;
  "spaces/notes": typeof spaces_notes;
  "spaces/polls": typeof spaces_polls;
  "spaces/roles": typeof spaces_roles;
  "spaces/rules": typeof spaces_rules;
  "spaces/schedule": typeof spaces_schedule;
  "spaces/voice": typeof spaces_voice;
  "spaces/voiceToken": typeof spaces_voiceToken;
  "spaces/welcome": typeof spaces_welcome;
  "users/achievements/achievementDefs": typeof users_achievements_achievementDefs;
  "users/achievements/core": typeof users_achievements_core;
  "users/achievements/helpers": typeof users_achievements_helpers;
  "users/achievements/migrations": typeof users_achievements_migrations;
  "users/achievements/mutations": typeof users_achievements_mutations;
  "users/achievements/queries": typeof users_achievements_queries;
  "users/achievements/sync": typeof users_achievements_sync;
  "users/achievements/system": typeof users_achievements_system;
  "users/achievements/types": typeof users_achievements_types;
  "users/activities/helpers": typeof users_activities_helpers;
  "users/activities/sanitize": typeof users_activities_sanitize;
  "users/friends/functions/addFriendByCode": typeof users_friends_functions_addFriendByCode;
  "users/friends/functions/generateNewCode": typeof users_friends_functions_generateNewCode;
  "users/friends/functions/getActiveCode": typeof users_friends_functions_getActiveCode;
  "users/friends/functions/getFriendRequests": typeof users_friends_functions_getFriendRequests;
  "users/friends/functions/getFriends": typeof users_friends_functions_getFriends;
  "users/friends/functions/getFriendship": typeof users_friends_functions_getFriendship;
  "users/friends/functions/respondToFriendRequest": typeof users_friends_functions_respondToFriendRequest;
  "users/friends/functions/toggleFriendFavorite": typeof users_friends_functions_toggleFriendFavorite;
  "users/friends/functions/toggleFriendMute": typeof users_friends_functions_toggleFriendMute;
  "users/friends/functions/updateFriendStatus": typeof users_friends_functions_updateFriendStatus;
  "users/friends/functions/useFriendCode": typeof users_friends_functions_useFriendCode;
  "users/friends/utils": typeof users_friends_utils;
  "users/onboarding/counters": typeof users_onboarding_counters;
  "users/onboarding/onboarding": typeof users_onboarding_onboarding;
  "users/onboarding/queries": typeof users_onboarding_queries;
  "users/onboarding/storage": typeof users_onboarding_storage;
  "users/onboarding/validation": typeof users_onboarding_validation;
  "users/profiles/functions/following/followUser": typeof users_profiles_functions_following_followUser;
  "users/profiles/functions/following/getFollowCount": typeof users_profiles_functions_following_getFollowCount;
  "users/profiles/functions/following/getFollowStatus": typeof users_profiles_functions_following_getFollowStatus;
  "users/profiles/functions/following/unfollowuser": typeof users_profiles_functions_following_unfollowuser;
  "users/profiles/functions/profileOverview": typeof users_profiles_functions_profileOverview;
  "users/profiles/functions/profileTypes": typeof users_profiles_functions_profileTypes;
  "users/profiles/functions/socialScore/getSocialScore": typeof users_profiles_functions_socialScore_getSocialScore;
  "users/profiles/functions/socialScore/initializeSocialScores": typeof users_profiles_functions_socialScore_initializeSocialScores;
  "users/profiles/functions/socialScore/scheduleScoreRestorations": typeof users_profiles_functions_socialScore_scheduleScoreRestorations;
  "users/profiles/functions/socialScore/socialScore": typeof users_profiles_functions_socialScore_socialScore;
  "users/profiles/functions/updateProfile": typeof users_profiles_functions_updateProfile;
  "users/profiles/snapshots": typeof users_profiles_snapshots;
  "users/profiles/types/index": typeof users_profiles_types_index;
  "users/settings": typeof users_settings;
  "users/suspensionFunctions": typeof users_suspensionFunctions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

import { v } from "convex/values";

export const activityTypeV = v.union(
  v.literal("post"),
  v.literal("achievement"),
  v.literal("friend"),
  v.literal("event"),
  v.literal("account_created"),
);

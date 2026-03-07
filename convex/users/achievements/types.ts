import { v } from "convex/values";
import { Doc, Id } from "../../_generated/dataModel";

export const rarityValidator = v.union(
  v.literal("common"),
  v.literal("uncommon"),
  v.literal("rare"),
  v.literal("epic"),
  v.literal("legendary"),
  v.literal("mythic")
);

export interface AchievementFields {
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
  maxUsers?: number;
  limitedEdition?: boolean;
}

export type UserAchievementDisplay = Doc<"achievements"> & {
  earnedDate: number;
  userId: Id<"users">;
};

export const achievementReturnType = v.object({
  _id: v.id("achievements"),
  _creationTime: v.number(),
  name: v.string(),
  description: v.string(),
  imageUrl: v.string(),
  category: v.string(),
  rarity: rarityValidator,
  limitedEdition: v.optional(v.boolean()),
  maxUsers: v.optional(v.number()),
});

export const userAchievementReturnType = v.object({
  _id: v.id("userAchievements"),
  _creationTime: v.number(),
  userId: v.id("users"),
  achievementId: v.id("achievements"),
  earnedDate: v.number(),
});

import { v } from "convex/values";

export const rarityV = v.union(
  v.literal("common"),
  v.literal("uncommon"),
  v.literal("rare"),
  v.literal("epic"),
  v.literal("legendary"),
  v.literal("mythic"),
);

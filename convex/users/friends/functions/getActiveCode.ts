import { v } from "convex/values";
import { query } from "../../../_generated/server";

const friendCodeReturnType = v.object({
  _id: v.id("friendCodes"),
  _creationTime: v.number(),
  userId: v.id("users"),
  code: v.string(),
  isActive: v.boolean(),
  createdAt: v.number(),
  usedBy: v.optional(v.array(v.id("users"))),
});

// Get active friend code for a user
export const getActiveCode = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(v.null(), friendCodeReturnType),
  handler: async (ctx, args) => {
    const activeCode = await ctx.db
      .query("friendCodes")
      .withIndex("by_user_and_isActive", (q) => q.eq("userId", args.userId).eq("isActive", true))
      .first();
    
    if (!activeCode) return null;
    
    // Return only the fields we need, excluding usedBy
    return {
      _id: activeCode._id,
      _creationTime: activeCode._creationTime,
      userId: activeCode.userId,
      code: activeCode.code,
      isActive: activeCode.isActive,
      createdAt: activeCode.createdAt,
    } as any;
  },
});

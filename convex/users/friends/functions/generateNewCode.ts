import { v } from "convex/values";
import { mutation } from "../../../_generated/server";
import { generateFriendCode } from "../utils";

const friendCodeReturnType = v.object({
  _id: v.id("friendCodes"),
  _creationTime: v.number(),
  userId: v.id("users"),
  code: v.string(),
  isActive: v.boolean(),
  createdAt: v.number(),
  usedBy: v.optional(v.array(v.id("users"))),
});

// Generate a new friend code
export const generateNewCode = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(v.null(), friendCodeReturnType),
  handler: async (ctx, args) => {
    // Deactivate any existing active codes
    const existingCodes = await ctx.db
      .query("friendCodes")
      .withIndex("by_user_and_isActive", (q) => q.eq("userId", args.userId).eq("isActive", true))
      .collect();

    for (const codeDoc of existingCodes) {
      await ctx.db.delete(codeDoc._id);
    }

    // Generate new code
    const newCodeValue = await generateFriendCode({ db: ctx.db });
    
    // Create new friend code
    const newCodeId = await ctx.db.insert("friendCodes", {
      userId: args.userId,
      code: newCodeValue,
      isActive: true,
      createdAt: Date.now(),
    });

    const newCode = await ctx.db.get(newCodeId);
    if (!newCode) return null;
    
    // Return only the fields we need, excluding usedBy
    return {
      _id: newCode._id,
      _creationTime: newCode._creationTime,
      userId: newCode.userId,
      code: newCode.code,
      isActive: newCode.isActive,
      createdAt: newCode.createdAt,
    } as any;
  },
});

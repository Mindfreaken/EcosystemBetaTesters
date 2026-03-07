import { mutation } from "../../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../../_generated/dataModel";

export const updateProfile = mutation({
  args: {
    userId: v.union(v.id("users"), v.string()),
    profileData: v.object({
      displayName: v.optional(v.string()),
      username: v.optional(v.string()),
      bio: v.optional(v.string()),
      customStatus: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      coverUrl: v.optional(v.string()),
      role: v.optional(v.string()),
      profileTypeId: v.optional(v.id("profileTypes"))
    })
  },
  handler: async (ctx, args) => {
    // In a production app, you would verify that the current user has permission
    // to update this profile. For now, we'll trust the userId provided.
    
    console.log("Received userId:", args.userId, "type:", typeof args.userId);
    
    // Resolve user ID (either Convex ID or Clerk ID string)
    let userId: Id<"users"> | null = null;
    let user = null;
    
    // Try different approaches to find the user
    if (typeof args.userId === "string") {
      console.log("Handling string userId:", args.userId);
      
      // First approach: Try direct lookup assuming it's a valid Convex ID string
      try {
        console.log("Trying direct lookup with ID:", args.userId);
        user = await ctx.db.get(args.userId as Id<"users">);
        if (user) {
          console.log("Found user via direct lookup", user._id);
          userId = user._id;
        }
      } catch (error) {
        console.log("Direct lookup failed, will try other methods", error);
      }
      
      // Second approach: Try as Clerk ID if direct lookup failed
      if (!user) {
        console.log("Trying as Clerk ID:", args.userId);
        user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", q => q.eq("clerkUserId", args.userId))
          .first();
        if (user) {
          console.log("Found user via Clerk ID lookup", user._id);
          userId = user._id;
        }
      }
    } else {
      // It's already a proper Convex ID type
      console.log("Using provided Convex ID directly:", args.userId);
      try {
        user = await ctx.db.get(args.userId);
        if (user) {
          userId = args.userId;
        }
      } catch (error) {
        console.error("Error looking up user with provided ID:", error);
      }
    }
    
    // If we still haven't found the user, throw an error
    if (!user || !userId) {
      console.error(`User not found for ID: ${args.userId}`);
      throw new Error("User not found");
    }
    
    console.log(`Updating user with ID: ${userId}, user:`, user);
    
    // Update fields in the users table
    const userUpdates: Record<string, any> = {
      updatedAt: Date.now()
    };
    
    if (args.profileData.displayName !== undefined) {
      const dn = (args.profileData.displayName ?? "").trim();
      if (dn.length > 20) {
        throw new Error("Display name must be at most 20 characters");
      }
      userUpdates.displayName = dn;
      // Maintain lowercase field for indexing/search
      userUpdates.displayNameLower = dn.toLowerCase();
    }
    
    if (args.profileData.username !== undefined) {
      const un = (args.profileData.username ?? "").trim();
      if (un.length > 20) {
        throw new Error("Username must be at most 20 characters");
      }
      userUpdates.username = un;
      // Maintain lowercase field for indexing/search
      userUpdates.usernameLower = un.toLowerCase();
    }
    
    if (args.profileData.bio !== undefined) {
      const bio = (args.profileData.bio ?? '').trim();
      if (bio.length > 280) {
        throw new Error('Bio must be at most 280 characters');
      }
      userUpdates.bio = bio;
    }
    
    if (args.profileData.customStatus !== undefined) {
      const cs = (args.profileData.customStatus ?? "").trim();
      if (cs.length > 60) {
        throw new Error("Custom status must be at most 60 characters");
      }
      userUpdates.customStatus = cs;
    }
    
    if (args.profileData.avatarUrl !== undefined) {
      userUpdates.avatarUrl = args.profileData.avatarUrl;
    }
    
    if (args.profileData.coverUrl !== undefined) {
      userUpdates.coverUrl = args.profileData.coverUrl;
    }
    
    if (args.profileData.role !== undefined) {
      userUpdates.role = args.profileData.role;
    }
    
    // Only update if there are changes
    if (Object.keys(userUpdates).length > 1) { // > 1 because updatedAt is always included
      await ctx.db.patch(userId, userUpdates);
    }
    
    // Update profile type on the users table directly
    if (args.profileData.profileTypeId !== undefined) {
      await ctx.db.patch(userId, {
        profileTypeId: args.profileData.profileTypeId,
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
  }
});

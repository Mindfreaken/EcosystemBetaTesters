import { internalMutation } from "./_generated/server";

// This ID is used for the system user that sends welcome messages and system notifications
const SYSTEM_USER_ID = "system-user-0000-0000-0000-000000000000";

// Export as a named export for direct imports
export { SYSTEM_USER_ID };

// Also export as default for backward compatibility
export default { SYSTEM_USER_ID };

export const seedSystemParameters = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Create system parameters if they don't exist
    let existing = await ctx.db.query("system_parameters").first();

    if (!existing) {
      // Create with all required fields
      await ctx.db.insert("system_parameters", {
        doStorageBaseAllowanceGB: 250,
        freeUserStorageLimitGB: 2,
        systemUserId: SYSTEM_USER_ID,
      });
      console.log("Seeded system parameters.");
    } else if (!existing.systemUserId) {
      // Update existing record to include systemUserId if it doesn't have it
      await ctx.db.patch(existing._id, { systemUserId: SYSTEM_USER_ID });
      console.log("Updated system parameters with systemUserId.");
    } else {
      console.log("System parameters already seeded.");
    }

    // Ensure system user exists
    try {
      let systemUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", SYSTEM_USER_ID))
        .first();

      if (!systemUser) {
        console.log("Creating system user...");
        const userId = await ctx.db.insert("users", {
          clerkUserId: SYSTEM_USER_ID,
          username: "system",
          displayName: "System",
          email: "system@ecosystem.app",
          role: "system",
          avatarUrl: "/achievements/early_adopter_sticker.png",
          coverUrl: "/covers/default/default_011.png",
          bio: "Welcome to Ecosystem! I'm here to help you get started.",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isBanned: false,
          storageStatus: 'free',
          totalStorageAllocatedGB: 0,
        });
        
        // Verify the user was created
        systemUser = await ctx.db.get(userId);
        if (!systemUser) {
          throw new Error("Failed to create system user");
        }
        console.log("Created system user with ID:", userId);
      } else {
        console.log("System user already exists with ID:", systemUser._id);
      }
      
      // Update system parameters with the system user ID
      const params = await ctx.db.query("system_parameters").first();
      if (params && !params.systemUserId) {
        await ctx.db.patch(params._id, { systemUserId: systemUser._id });
        console.log("Updated system parameters with system user ID");
      }
      
      return systemUser._id;
    } catch (error) {
      console.error("Error ensuring system user exists:", error);
      throw error;
    }
  },
});
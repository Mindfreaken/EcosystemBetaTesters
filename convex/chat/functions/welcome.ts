import { internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";
import { SYSTEM_USER_ID } from "../../seed";

// Internal: Send a welcome DM from the system user to a newly created user
export const sendWelcomeDm = internalMutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, { userId }) => {
    try {
      const newUser = await ctx.db.get(userId);
      if (!newUser) return null;

      // Get or create system user (Clerk-based)
      let systemUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", SYSTEM_USER_ID))
        .first();

      if (!systemUser) {
        try {
          const sysId = await ctx.db.insert("users", {
            clerkUserId: SYSTEM_USER_ID,
            username: "system",
            displayName: "System",
            email: "system@ecosystem.app",
            role: "system",
            avatarUrl: "/achievements/early_adopter_sticker.png",
            coverUrl: "/covers/default/default_018.png",
            bio: "Welcome to Ecosystem! I'm here to help you get started.",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isAdmin: true,
            isBanned: false,
            storageStatus: 'free',
            totalStorageAllocatedGB: 0,
            currentStorageUsedGB: 0
          });
          systemUser = await ctx.db.get(sysId);
          if (!systemUser) return null;
        } catch (error) {
          console.error("Failed to create system user:", error);
          return null;
        }
      }

      // Check if a chat already exists between system and user
      const existingChats = await ctx.db
        .query("chats")
        .filter((q) =>
          q.and(
            q.eq(q.field("isGroup"), false),
            q.and(
              q.eq(q.field("participants"), [systemUser._id as Id<"users">, userId])
            )
          )
        )
        .collect();

      let chatId: Id<"chats">;
      if (existingChats.length > 0) {
        chatId = existingChats[0]._id;
      } else {
        chatId = await ctx.db.insert("chats", {
          isGroup: false,
          participants: [systemUser._id as Id<"users">, userId],
          createdBy: systemUser._id as Id<"users">,
          status: "active" as const,
        });
      }

      const displayName = newUser.displayName || newUser.username || "new user";
      const welcomeMessage = `👋 Welcome to Ecosystem, ${displayName}! We're thrilled to have you here.
\nThis site is dedicated to openness and transparency. Your feedback is crucial to our success - without it, we'll never improve.
\nFeel free to explore, and if something doesn't work or feels clunky, please let us know in the Discord server until we get our own Space set up!`;

      await ctx.db.insert("messages", {
        chatId,
        content: welcomeMessage,
        senderId: systemUser._id as Id<"users">,
        sentAt: Date.now(),
        isEdited: false,
        isDeleted: false,
      });

      return null;
    } catch (error) {
      console.error("sendWelcomeDm error:", error);
      return null;
    }
  },
});

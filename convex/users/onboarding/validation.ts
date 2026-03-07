import { query } from "../../_generated/server";
import { v } from "convex/values";

// Check if a username or display name already exists
export const checkExistingUserFields = query({
  args: {
    username: v.optional(v.string()),
    displayName: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { username, displayName } = args;
    
    // Check if username exists (case-insensitive)
    let existingUsername: any = null;
    if (username && username.trim() !== '') {
      const searchUsername = username.toLowerCase().trim();
      console.log('Searching for username:', searchUsername);
      
      try {
        // Try with index first
        existingUsername = await ctx.db
          .query("users")
          .withIndex("by_username_lower", (q) => q.eq("usernameLower", searchUsername))
          .first();
          
        // If not found with index, try full table scan as fallback
        if (!existingUsername) {
          console.log('Username not found with index, trying full table scan');
          const allUsers = await ctx.db.query("users").collect();
          existingUsername = allUsers.find(
            user => user.usernameLower && user.usernameLower.toLowerCase() === searchUsername
          );
          
          // If still not found, try direct string comparison as last resort
          if (!existingUsername) {
            existingUsername = allUsers.find(
              user => user.username && user.username.toLowerCase() === searchUsername
            );
          }
        }
      } catch (error) {
        console.error('Error checking username:', error);
      }
    }

    // Check if display name exists (case-insensitive)
    let existingDisplayName: any = null;
    if (displayName && displayName.trim() !== '') {
      const searchDisplayName = displayName.toLowerCase().trim();
      console.log('Searching for display name:', searchDisplayName);
      
      try {
        // Try with index first
        existingDisplayName = await ctx.db
          .query("users")
          .withIndex("by_display_name_lower", (q) => q.eq("displayNameLower", searchDisplayName))
          .first();
          
        // If not found with index, try full table scan as fallback
        if (!existingDisplayName) {
          console.log('Display name not found with index, trying full table scan');
          const allUsers = await ctx.db.query("users").collect();
          existingDisplayName = allUsers.find(
            user => user.displayNameLower && user.displayNameLower.toLowerCase() === searchDisplayName
          );
          
          // If still not found, try direct string comparison as last resort
          if (!existingDisplayName) {
            existingDisplayName = allUsers.find(
              user => user.displayName && user.displayName.toLowerCase() === searchDisplayName
            );
          }
        }
      } catch (error) {
        console.error('Error checking display name:', error);
      }
    }

    // Debug logging
    console.log('checkExistingUserFields', {
      input: { username, displayName },
      usernameExists: !!existingUsername,
      displayNameExists: !!existingDisplayName,
      existingUsername: existingUsername?.username,
      existingDisplayName: existingDisplayName?.displayName
    });

    return {
      usernameExists: !!existingUsername,
      displayNameExists: !!existingDisplayName,
      existingUsername: existingUsername?.username,
      existingDisplayName: existingDisplayName?.displayName
    };
  },
});

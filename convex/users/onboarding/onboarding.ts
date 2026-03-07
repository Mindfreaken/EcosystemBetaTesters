import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../../_generated/api";
import { generateFriendCode } from "../friends/utils";


// Create a new user with complete onboarding
export const createUser = mutation({
  args: {
    email: v.string(),
    displayName: v.string(),
    username: v.string(),
    dateOfBirth: v.number(),
    createdAt: v.number(),
    // Optional: normalized E.164 phone from Clerk, and original formatted number
    phoneE164: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { email, displayName, username, dateOfBirth, createdAt, phoneE164, phoneNumber }) => {
    const identity = await ctx.auth.getUserIdentity?.();
    if (!identity) {
      throw new Error("Unauthorized: missing Clerk identity");
    }
    const clerkUserId = identity.subject; // Clerk user ID
    console.log("createUser called with:", { clerkUserId, email, displayName, username, dateOfBirth, createdAt });

    // Normalize and validate username/displayName lengths (<= 20)
    const normalizedUsername = username.trim();
    const normalizedDisplayName = displayName.trim();
    if (normalizedUsername.length > 20) {
      throw new Error("Username must be at most 20 characters");
    }
    if (normalizedDisplayName.length > 20) {
      throw new Error("Display name must be at most 20 characters");
    }

    // 0. Check for existing username/display name/email/phone (case-insensitive/normalized)
    const existingUserCheck = await ctx.db
      .query("users")
      .withIndex("by_username_lower", (q) => q.eq("usernameLower", normalizedUsername.toLowerCase()))
      .first();

    if (existingUserCheck) {
      throw new Error(`Username "${username}" is already taken`);
    }

    // Display name uniqueness check
    const existingDisplayNameCheck = await ctx.db
      .query("users")
      .withIndex("by_display_name_lower", (q) => q.eq("displayNameLower", normalizedDisplayName.toLowerCase()))
      .first();

    if (existingDisplayNameCheck) {
      throw new Error(`Display name "${displayName}" is already taken`);
    }

    const existingEmailCheck = await ctx.db
      .query("users")
      .withIndex("by_email_lower", (q) => q.eq("emailLower", email.toLowerCase()))
      .first();

    if (existingEmailCheck) {
      throw new Error(`Email is already in use`);
    }

    if (phoneE164) {
      const existingPhoneCheck = await ctx.db
        .query("users")
        .withIndex("by_phone_e164", (q) => q.eq("phoneE164", phoneE164))
        .first();
      if (existingPhoneCheck) {
        throw new Error(`Phone number is already in use`);
      }
    }

    // 1. Initialize master data (do this first)
    await ctx.runMutation(api.users.achievements.achievementDefs.initializeAchievementDefs);
    await ctx.runMutation(api.users.profiles.functions.profileTypes.initializeProfileTypes);

    // 2. Get a join number for this user by incrementing counter
    const joinNumber = await ctx.runMutation(api.users.onboarding.counters.incrementJoinCounter);

    // 3. Get random default avatar and cover URLs
    const defaultAvatarUrl = `/avatars/default/default_${String(Math.floor(Math.random() * 15) + 1).padStart(3, '0')}.jpg`;
    const defaultCoverUrl = `/covers/default/default_${String(Math.floor(Math.random() * 18) + 1).padStart(3, '0')}.png`;

    // 4. Create the user record with all required fields
    console.log("Attempting to insert user into DB:", { clerkUserId, username });
    const userId = await ctx.db.insert("users", {
      clerkUserId,
      username: normalizedUsername,
      usernameLower: normalizedUsername.toLowerCase(),
      displayName: normalizedDisplayName,
      displayNameLower: normalizedDisplayName.toLowerCase(),
      email,
      emailLower: email.toLowerCase(),
      phoneNumber: phoneNumber ?? undefined,
      phoneE164: phoneE164 ?? undefined,
      dateOfBirth: dateOfBirth,
      role: 'user',
      ecosystemdevs: false,
      avatarUrl: defaultAvatarUrl,
      coverUrl: defaultCoverUrl,
      bio: "Hey there! I'm exploring this new platform.",
      customStatus: "New member",
      joinNumber,
      createdAt,
      updatedAt: createdAt,
      isAdmin: false,
      isBanned: false,
      suspensionStatus: undefined, // undefined = Active/Normal
      storageStatus: 'free',
      totalStorageAllocatedGB: 2, // Default free tier storage
      currentStorageUsedGB: 0,
      xp: 0,
      overseer: false,
      overseerPoints: 0
    });
    console.log("User inserted with Convex ID:", userId, "for Clerk ID:", clerkUserId);

    // 5. Create default settings
    await ctx.db.insert("settings", {
      userId,
      clerkUserId,
      theme: "nightCityDark",
      updatedAt: createdAt,
      showCallsInHeader: false,
      useThemeColorForRage: false
    });

    // 6. Make sure achievements are initialized (consider if this is needed per user creation)
    await ctx.runMutation(api.users.achievements.core.initializeAchievements);

    // 7. Award "Community Member" achievement
    const joinAchievement = await ctx.db
      .query("achievements")
      .withIndex("by_name", (q) => q.eq("name", "Community Member"))
      .unique();

    if (joinAchievement) {
      await ctx.runMutation(api.users.achievements.mutations.awardAchievement, {
        userId,
        achievementId: joinAchievement._id,
      });
    }

    // 8. Check if user qualifies for early adopter achievement
    await ctx.runMutation(api.users.achievements.mutations.checkEarlyAdopter, {
      userId,
      joinNumber,
    });

    // 9. Log account creation activity (without exposing internal IDs)
    await ctx.db.insert("activities", {
      userId,
      type: "account_created",
      title: "Account Created",
      description: `User ${username} joined the platform.`,
      timestamp: createdAt, // or Date.now() if preferred
    });

    // 10. Send welcome message from system user (decoupled into chat/functions/welcome)
    await ctx.scheduler.runAfter(0, internal.chat.functions.welcome.sendWelcomeDm, { userId });

    // 11. Initialize social score
    await ctx.db.insert("socialScores", {
      userId,
      score: 10000, // Start with a perfect score
      lastUpdated: createdAt,
    });

    // 12. Generate initial friend code inline (avoid cross-module public mutation lookup)
    try {
      // Remove any existing active codes (defensive, though user is new)
      const existingCodes = await ctx.db
        .query("friendCodes")
        .withIndex("by_user_and_isActive", (q) => q.eq("userId", userId).eq("isActive", true))
        .collect();

      for (const codeDoc of existingCodes) {
        await ctx.db.delete(codeDoc._id);
      }

      const newCodeValue = await generateFriendCode({ db: ctx.db });
      await ctx.db.insert("friendCodes", {
        userId,
        code: newCodeValue,
        isActive: true,
        createdAt: Date.now(),
      });
    } catch (e) {
      console.error("Failed to generate initial friend code during onboarding (inline):", e);
      // Non-fatal: proceed without blocking account creation
    }

    return null;
  },
});

// Ensure a user exists, creating them if necessary
export const ensureUser = mutation({
  args: {
    // Clerk identity will be used to identify the user; no external id in args
    email: v.string(),
    displayName: v.string(),
    username: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    phoneE164: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("ensureUser called with args:", args);

    const identity = await ctx.auth.getUserIdentity?.();
    if (!identity) {
      throw new Error("Unauthorized: missing Clerk identity");
    }
    const clerkUserId = identity.subject;

    // Check if user already exists by Clerk ID
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", clerkUserId))
      .first();

    // If not found by Clerk ID, attempt to find by email and link this Clerk ID
    if (!existingUser && args.email) {
      const emailLower = args.email.toLowerCase();
      const userByEmail = await ctx.db
        .query("users")
        .withIndex("by_email_lower", (q) => q.eq("emailLower", emailLower))
        .first();

      if (userByEmail) {
        // Attach/refresh Clerk ID to this user document
        await ctx.db.patch(userByEmail._id, { clerkUserId });
        console.log(
          "ensureUser: Linked existing user by email to Clerk ID:",
          clerkUserId,
          "User ID:",
          userByEmail._id
        );
        return; // Done
      }
    }

    if (existingUser === null) {
      // Normalize dateOfBirth to a DB-friendly ms timestamp if provided
      const normalizeDob = (val: unknown): number | undefined => {
        if (typeof val === "number") {
          // If looks like seconds (10 digits), convert to ms
          if (val > 0 && val < 1e12) return Math.floor(val * 1000);
          return val > 0 ? Math.floor(val) : undefined;
        }
        if (typeof val === "string" && val.trim()) {
          const t = Date.parse(val);
          return Number.isNaN(t) ? undefined : t;
        }
        return undefined;
      };
      const normalizedDob = normalizeDob(args.dateOfBirth);
      // Check if username already exists (case-insensitive)
      if (args.username) {
        const username = args.username.trim();
        if (username.length > 20) {
          throw new Error("Username must be at most 20 characters");
        }
        const existingUsername = await ctx.db
          .query("users")
          .withIndex("by_username_lower", (q) => q.eq("usernameLower", username.toLowerCase()))
          .first();

        if (existingUsername) {
          throw new Error(`Username "${username}" is already taken`);
        }
      }

      // If a displayName is provided, ensure it's unique as well
      if (args.displayName) {
        const dn = args.displayName.trim();
        if (dn.length > 20) {
          throw new Error("Display name must be at most 20 characters");
        }
        const existingDN = await ctx.db
          .query("users")
          .withIndex("by_display_name_lower", (q) => q.eq("displayNameLower", dn.toLowerCase()))
          .first();
        if (existingDN) {
          throw new Error(`Display name "${dn}" is already taken`);
        }
      }

      // Check if email already exists (lower-cased)
      if (args.email) {
        const existingEmail = await ctx.db
          .query("users")
          .withIndex("by_email_lower", (q) => q.eq("emailLower", args.email.toLowerCase()))
          .first();
        if (existingEmail) {
          throw new Error(`Email is already in use`);
        }
      }
      console.log("ensureUser: No existing user found for Clerk ID:", clerkUserId);
      // User doesn't exist.
      // IMPORTANT: Only create the user if the username was explicitly provided
      // This prevents the onAuthStateChanged listener (which lacks username) from creating the user prematurely.
      if (args.username) {
        // Username was provided (call originates from register function)
        console.log("ensureUser: Username provided, proceeding to call createUser for Clerk ID:", clerkUserId);
        await ctx.runMutation(api.users.onboarding.onboarding.createUser, {
          email: args.email,
          displayName: (args.displayName ?? "").trim(),
          username: (args.username ?? "").trim(),
          dateOfBirth: normalizedDob ?? 0,
          createdAt: Date.now(),
          phoneE164: args.phoneE164,
        });
      } else {
        // Do not auto-create without a confirmed username (and DOB). Wait for full registration flow.
        console.log("ensureUser: Username not provided; skipping user creation for Clerk ID:", clerkUserId);
        return;
      }
    } else {
      console.log("ensureUser: Existing user found for Clerk ID:", clerkUserId, "User ID:", existingUser._id);
      // Normalize and patch DOB if provided and stored is missing/invalid
      const normalizeDob = (val: unknown): number | undefined => {
        if (typeof val === "number") {
          if (val > 0 && val < 1e12) return Math.floor(val * 1000);
          return val > 0 ? Math.floor(val) : undefined;
        }
        if (typeof val === "string" && val.trim()) {
          const t = Date.parse(val);
          return Number.isNaN(t) ? undefined : t;
        }
        return undefined;
      };
      const normalizedDob = normalizeDob(args.dateOfBirth);
      const providedDobValid = typeof normalizedDob === "number" && normalizedDob > 0;
      const storedDobValid = typeof (existingUser as any).dateOfBirth === "number" && (existingUser as any).dateOfBirth > 0;
      if (providedDobValid && !storedDobValid) {
        await ctx.db.patch(existingUser._id, {
          dateOfBirth: normalizedDob,
          updatedAt: Date.now(),
        });
        console.log("ensureUser: Updated missing dateOfBirth for existing user:", existingUser._id);
      }
      console.log(`User already exists for Clerk ID: ${clerkUserId}`);
    }
  },
});

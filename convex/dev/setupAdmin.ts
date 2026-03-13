import { mutation } from "../_generated/server";

export const createDashboardAdmin = mutation({
    args: {},
    handler: async (ctx) => {
        const fakeId = "fake_id";

        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", fakeId))
            .first();

        if (existingUser) {
            await ctx.db.patch(existingUser._id, {
                overseeradmin: true,
                displayName: "Dashboard Admin"
            });
            return "Existing user 'fake_id' updated to Overseer Admin.";
        } else {
            await ctx.db.insert("users", {
                clerkUserId: fakeId,
                username: "dashboard_admin",
                usernameLower: "dashboard_admin",
                displayName: "Dashboard Admin",
                displayNameLower: "dashboard admin",
                email: "admin@example.com",
                createdAt: Date.now(),
                updatedAt: Date.now(),
                overseeradmin: true,
                isBanned: false,
                // Add other required fields with defaults
                role: "admin",
                storageStatus: "free",
                totalStorageAllocatedGB: 10,
                currentStorageUsedGB: 0,
                xp: 0,
            });
            return "Created new Admin user with clerkUserId: 'fake_id'";
        }
    },
});

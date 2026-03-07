import { mutation, query } from "../../_generated/server";
import { v } from "convex/values";

// Initialize the join counter if it doesn't exist
export const initJoinCounter = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const counter = await ctx.db
      .query("counters")
      .withIndex("by_name", (q) => q.eq("name", "joinCounter"))
      .first();
    
    if (!counter) {
      await ctx.db.insert("counters", {
        name: "joinCounter",
        value: 0,
      });
    }
    
    return null;
  },
});

// Atomically increment and get the join counter
export const incrementJoinCounter = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const counter = await ctx.db
      .query("counters")
      .withIndex("by_name", (q) => q.eq("name", "joinCounter"))
      .first();
    
    if (!counter) {
      // Initialize if not exists
      await ctx.db.insert("counters", {
        name: "joinCounter",
        value: 1,
      });
      return 1;
    }
    
    // Atomically increment the counter
    await ctx.db.patch(counter._id, {
      value: counter.value + 1,
    });
    
    return counter.value + 1;
  },
});

// Get the current join counter value
export const getJoinCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const counter = await ctx.db
      .query("counters")
      .withIndex("by_name", (q) => q.eq("name", "joinCounter"))
      .first();
    
    return counter?.value || 0;
  },
}); 
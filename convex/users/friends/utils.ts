import type { DatabaseReader } from "../../_generated/server";

// Generate a unique friend code
export async function generateFriendCode(ctx: { db: DatabaseReader }): Promise<string> {
  const length = 8;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let friendCode: string = ""; // Initialize friendCode
  let isUnique = false;

  while (!isUnique) {
    // Generate a random code
    friendCode = Array.from(
      { length },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');

    // Check if code is unique in friendCodes table
    const existing = await ctx.db
      .query("friendCodes")
      .withIndex("by_code", q => q.eq("code", friendCode)) // Used withIndex
      .first();

    if (!existing) {
      isUnique = true;
      // No need to return here, loop will exit and return friendCode below
    }
  }
  // Loop terminates when isUnique is true, friendCode will hold the unique code.
  return friendCode; 
} 
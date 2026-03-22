import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { SYSTEM_USER_ID } from "../seed";

/**
 * Send a DM from the System user to a target user.
 */
export async function sendSystemDM(ctx: MutationCtx, targetUserId: Id<"users">, content: string) {
    const systemUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", SYSTEM_USER_ID))
        .unique();

    if (!systemUser) {
        console.error("System user not found. DM not sent.");
        return;
    }

    // Find DM chat
    const chats = await ctx.db
        .query("chats")
        .withIndex("by_isGroup", (q) => q.eq("isGroup", false))
        .collect();
    
    let chat = chats.find(c => 
        c.participants.length === 2 && 
        c.participants.includes(systemUser._id) && 
        c.participants.includes(targetUserId)
    );

    let chatId: Id<"chats">;
    if (!chat) {
        chatId = await ctx.db.insert("chats", {
            participants: [systemUser._id, targetUserId],
            isGroup: false,
            createdBy: systemUser._id,
            status: "active",
            createdAt: Date.now(),
            lastActivityAt: Date.now(),
        });
    } else {
        chatId = chat._id;
        await ctx.db.patch(chatId, { lastActivityAt: Date.now() });
    }

    // Send message
    await ctx.db.insert("messages", {
        chatId,
        content,
        senderId: systemUser._id,
        sentAt: Date.now(),
        isEdited: false,
        isDeleted: false,
    });
}

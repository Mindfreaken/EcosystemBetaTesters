import { Id } from "../../_generated/dataModel";

// Helper function to check if a user is an admin or creator of a group chat
export const isUserAdminOrCreator = async (
  ctx: { db: any },
  chatId: Id<"chats">,
  userId: Id<"users">
): Promise<boolean> => {
  const chat = await ctx.db.get(chatId);
  if (!chat || !chat.isGroup) {
    return false;
  }
  if (chat.createdBy === userId) {
    return true;
  }
  if (chat.admins?.includes(userId)) {
    return true;
  }
  return false;
};

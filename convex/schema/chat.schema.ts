import { messageTables } from "./chat/messages";
import { reactionTables } from "./chat/reactions";
import { taskTables } from "./chat/tasks";
import { readReceiptTables } from "./chat/readReceipts";
import { editTables } from "./chat/edits";
import { deleteTables } from "./chat/deletes";
import { chatTables as chatsTables } from "./chat/chats";
import { attachmentTables } from "./chat/attachments";
import { keyTables } from "./chat/keys";

// Aggregated Chat domain tables
export const chatTables = {
  ...messageTables,
  ...reactionTables,
  ...taskTables,
  ...readReceiptTables,
  ...editTables,
  ...deleteTables,
  ...chatsTables,
  ...attachmentTables,
  ...keyTables,
} as const;

import type { Id } from "../../../convex/_generated/dataModel";
import type { Friend, FriendRequest, UserDetailsByConvexId } from "./types.ts";

type ConvexFriendDoc = {
  _id: Id<"friends">;
  userId: Id<"users">;
  friendId: Id<"users">;
  status: "active" | "blocked" | "removed";
  isMuted: boolean;
  isFavorite: boolean;
  createdAt?: number | string; // epoch ms or ISO
  updatedAt?: number | string; // epoch ms or ISO
};

type ConvexFriendRequestDoc = {
  _id: Id<"friendRequests">;
  senderId: string;    // firebase id (as your page expects)
  receiverId: string;  // firebase id (as your page expects)
  status: "pending" | "accepted" | "rejected";
  createdAt: number | string;
  updatedAt?: number | string;
  sender: {
    _id: Id<"users">;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
};

export function mapFriendDocToFriend(
  friendDoc: ConvexFriendDoc,
  userDetailsMap?: Map<Id<"users">, UserDetailsByConvexId> | null
): Friend {
  const details = userDetailsMap?.get(friendDoc.friendId);
  const createdAtISO =
    typeof friendDoc.createdAt === "number"
      ? new Date(friendDoc.createdAt).toISOString()
      : friendDoc.createdAt || new Date().toISOString();

  return {
    id: friendDoc._id,
    userId: friendDoc.userId,
    friendId: friendDoc.friendId,
    username: details?.username || `User ${String(friendDoc.friendId).slice(0, 5)}`,
    displayName: details?.displayName || `Friend ${String(friendDoc.friendId).slice(0, 5)}`,
    avatarUrl: details?.avatarUrl ?? null,
    status: friendDoc.status,
    dateAdded: createdAtISO,
    isMuted: friendDoc.isMuted,
    isFavorite: friendDoc.isFavorite,
    createdAt: createdAtISO,
    updatedAt:
      typeof friendDoc.updatedAt === "number"
        ? new Date(friendDoc.updatedAt).toISOString()
        : friendDoc.updatedAt || createdAtISO,
  };
}

export function mapRequestDocToFriendRequest(
  req: ConvexFriendRequestDoc
): FriendRequest {
  const createdAtISO =
    typeof req.createdAt === "number"
      ? new Date(req.createdAt).toISOString()
      : req.createdAt;
  const updatedAtISO =
    typeof req.updatedAt === "number"
      ? new Date(req.updatedAt).toISOString()
      : req.updatedAt || createdAtISO;

  return {
    id: req._id,
    senderId: req.senderId,
    receiverId: req.receiverId,
    senderConvexId: req.sender._id,
    senderUsername: req.sender.username,
    senderDisplayName: req.sender.displayName,
    senderAvatarUrl: req.sender.avatarUrl ?? null,
    status: req.status,
    createdAt: createdAtISO,
    updatedAt: updatedAtISO,
  };
}


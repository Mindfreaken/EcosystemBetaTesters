import type { Id } from "../../../convex/_generated/dataModel";

export type FriendStatus = "active" | "blocked" | "removed" | "pending";

// Filter ids used by friends UI
export type FriendFilterType = "all" | "pending" | "blocked" | "favorite";

export interface Friend {
  id: Id<"friends"> | Id<"friendRequests">; // pending uses request id
  userId: Id<"users">;
  friendId: Id<"users">;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status: FriendStatus;
  dateAdded: string; // ISO string
  isMuted: boolean;
  isFavorite: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface FriendRequest {
  id: Id<"friendRequests">;
  senderId: string; // firebase (as in FriendsPage)
  receiverId: string; // firebase (as in FriendsPage)
  senderConvexId: Id<"users">;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatarUrl: string | null;
  status: "pending" | "accepted" | "rejected";
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface UserDetailsByConvexId {
  userId: Id<"users">;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export interface UseGetFriendRequestsParams {
  clerkUserId: string | null | undefined; // Clerk user id
  type: "received" | "sent";
  status: "pending" | "accepted" | "rejected";
}

export function useGetFriendRequests(params: UseGetFriendRequestsParams) {
  const { clerkUserId, type, status } = params;
  const enabled = Boolean(clerkUserId);

  const result = useQuery(
    api.users.friends.functions.getFriendRequests.getFriendRequests,
    enabled
      ? {
          userId: clerkUserId as string,
          type,
          status,
        }
      : "skip"
  ) as any[] | undefined;

  return result;
}

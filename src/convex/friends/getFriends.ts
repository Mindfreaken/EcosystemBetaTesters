import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export interface UseGetFriendsParams {
  clerkUserId: string | null | undefined;
  status?: "active" | "blocked";
  isFavorite?: boolean;
}

export function useGetFriends(params: UseGetFriendsParams) {
  const { clerkUserId, status, isFavorite } = params;
  const enabled = Boolean(clerkUserId);

  const result = useQuery(
    api.users.friends.functions.getFriends.getFriends,
    enabled
      ? {
          clerkUserId: clerkUserId as string,
          ...(status ? { status } : {}),
          ...(typeof isFavorite === "boolean" ? { isFavorite } : {}),
        }
      : "skip"
  ) as any[] | undefined;

  return result;
}

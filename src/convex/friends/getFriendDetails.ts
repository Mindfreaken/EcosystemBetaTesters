import type { Id } from "../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function useGetFriendDetails(userIds: Id<"users">[] | undefined) {
  const enabled = !!userIds && userIds.length > 0;
  const result = useQuery(
    api.users.onboarding.queries.getUsersDetailsByConvexId,
    enabled ? { userIds } : "skip"
  ) as
    | Array<{
        userId: Id<"users">;
        username: string;
        displayName: string;
        avatarUrl: string | null;
      }>
    | undefined;

  return result;
}

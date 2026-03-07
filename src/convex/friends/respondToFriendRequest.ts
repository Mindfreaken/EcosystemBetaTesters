import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export function useRespondToFriendRequest() {
  const mutate = useMutation(
    api.users.friends.functions.respondToFriendRequest.respondToFriendRequest
  );
  return async (args: { requestId: Id<"friendRequests">; response: "accepted" | "rejected" }) => {
    return await mutate(args);
  };
}

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export function useToggleFriendMute() {
  const mutate = useMutation(api.users.friends.functions.toggleFriendMute as any);
  return async (args: { friendshipId: Id<"friends"> }) => {
    return await mutate(args);
  };
}

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export function useUpdateFriendStatus() {
	const mutate = useMutation(
		api.users.friends.functions.updateFriendStatus as any
	);
	return async (args: { friendshipId: Id<"friends">; status: "active" | "blocked" | "removed" }) => {
		return await mutate(args);
	};
}



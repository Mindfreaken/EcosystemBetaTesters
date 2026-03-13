import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export function useToggleFriendFavorite() {
	const mutate = useMutation(
		api.users.friends.functions.toggleFriendFavorite as any
	);
	return async (args: { friendshipId: Id<"friends"> }) => {
		return await mutate(args);
	};
}



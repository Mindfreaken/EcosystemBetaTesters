import React, { forwardRef, useImperativeHandle } from "react";
import type { Friend, FriendFilterType } from "@/convex/friends/types";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import PersonIcon from "@mui/icons-material/Person";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import PeopleIcon from "@mui/icons-material/People";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import BlockIcon from "@mui/icons-material/Block";
import StarIcon from "@mui/icons-material/Star";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import CollectionsBookmarkIcon from "@mui/icons-material/CollectionsBookmark";
import UiIconButton from "@/components/ui/UiIconButton";
import UiButton from "@/components/ui/UiButton";

interface FriendsListProps {
  friends: Friend[];
  currentFilter: FriendFilterType;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onMessage: (friend: Friend) => void;
  onViewProfileCard: (friend: Friend) => void;
  onMoreActions: (friend: Friend) => void;
  onLoadMore: () => void;
  onAcceptRequest: (friend: Friend) => void;
  onRejectRequest: (friend: Friend) => void;
  onFriendUpdated: (friend: Friend) => void;
  onViewFullProfile: (friend: Friend) => void;
  onViewCollections: (friend: Friend) => void;
}

export interface FriendsListRef {
  updateFriend: (updatedFriend: Friend) => void;
}

const FriendsList = forwardRef<FriendsListRef, FriendsListProps>((props, ref) => {
  const {
    friends,
    currentFilter,
    isLoading,
    isLoadingMore,
    hasMore,
    onMessage,
    onViewProfileCard,
    onMoreActions,
    onLoadMore,
    onAcceptRequest,
    onRejectRequest,
    onViewFullProfile,
    onViewCollections,
  } = props;

  useImperativeHandle(ref, () => ({
    updateFriend: (updatedFriend: Friend) => props.onFriendUpdated(updatedFriend),
  }));

  const displayedFriends =
    currentFilter === "favorite"
      ? friends.filter((f) => f.isFavorite && f.status !== "blocked")
      : friends;

  return (
    <>
    <div className="friends-scroll flex flex-1 min-h-0 flex-col overflow-y-auto p-4">
      {/* Loading */}
      {isLoading && (
        <div className="flex flex-1 flex-col items-center justify-center text-zinc-400">
          <div className="mb-4 h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-transparent" />
          <p className="text-base">Loading friends...</p>
        </div>
      )}

      {/* Empty states */}
      {!isLoading && displayedFriends.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center text-center text-zinc-400">
          {currentFilter === "all" && (
            <div>
              <PeopleIcon className="mb-4 !text-[3rem]" />
              <p className="text-base">You haven't added any friends yet</p>
            </div>
          )}
          {currentFilter === "pending" && (
            <div>
              <PendingActionsIcon className="mb-4 !text-[3rem]" />
              <p className="text-base">No pending friend requests</p>
            </div>
          )}
          {currentFilter === "blocked" && (
            <div>
              <BlockIcon className="mb-4 !text-[3rem]" />
              <p className="text-base">You haven't blocked any users</p>
            </div>
          )}
          {currentFilter === "favorite" && (
            <div>
              <StarIcon className="mb-4 !text-[3rem]" />
              <p className="text-base">You haven't favorited any friends yet</p>
            </div>
          )}
        </div>
      )}

      {/* List */}
      {!isLoading && displayedFriends.length > 0 && (
        <div className="flex flex-col gap-3">
          {(currentFilter === "all" || currentFilter === "favorite") &&
            displayedFriends.map((friend) => (
              <div
                key={friend.id}
                className={[
                  "flex items-center rounded-xl p-4 transition",
                  "bg-[var(--card)] border border-[var(--border)]",
                  "shadow-[0_2px_8px_rgba(0,0,0,0.28)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.32)]",
                  "hover:bg-[var(--cardHover)]",
                  friend.isFavorite ? "border-l-4 border-yellow-500" : "",
                ].join(" ")}
              >
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-zinc-200">
                  {friend.avatarUrl ? (
                    <img src={friend.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <AccountBoxIcon className="!text-[2rem] text-zinc-500" />
                  )}
                </div>

                <div className="ml-4 flex-1">
                  <div className="flex items-center gap-2 text-base font-semibold text-zinc-100">
                    {friend.displayName}
                    {friend.isMuted && <VolumeOffIcon className="!text-sm text-zinc-500" />}
                  </div>
                </div>

                <div className="flex gap-2">
                  <UiIconButton variant="primary" size="sm" onClick={() => onMessage(friend)} title="Message">
                    <ChatBubbleOutlineIcon className="!text-[1.1rem]" />
                  </UiIconButton>
                  {/* Removed 'View Profile Card' button for All/Favorites */}
                  {/* Collections button temporarily disabled
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                    onClick={() => onViewCollections(friend)}
                    title="Collections"
                  >
                    <CollectionsBookmarkIcon className="!text-[1.1rem]" />
                  </button>
                  */}
                  <UiIconButton variant="secondary" size="sm" onClick={() => onViewFullProfile(friend)} title="View Full Profile">
                    <PersonIcon className="!text-[1.1rem]" />
                  </UiIconButton>
                  <UiIconButton variant="ghost" size="sm" onClick={() => onMoreActions(friend)} title="More">
                    <MoreHorizIcon className="!text-[1.1rem]" />
                  </UiIconButton>
                </div>
              </div>
            ))}

          {currentFilter === "pending" &&
            displayedFriends.map((friend) => (
              <div
                key={friend.id}
                className="mb-3 flex items-center rounded-xl p-4 bg-[var(--card)] border border-[var(--border)] shadow-[0_2px_8px_rgba(0,0,0,0.28)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.32)] hover:bg-[var(--cardHover)] transition"
              >
                <div className="h-12 w-12 overflow-hidden rounded-full bg-zinc-800">
                  <img
                    src={friend.avatarUrl || "/avatars/default/default_001.jpg"}
                    alt={`${friend.displayName}'s avatar`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center gap-2 text-base font-semibold text-zinc-100">
                    {friend.displayName}
                  </div>
                </div>
                <div className="flex gap-2">
                  <UiIconButton variant="secondary" size="sm" title="View Profile Card" onClick={() => onViewProfileCard(friend)}>
                    <AccountBoxIcon className="!text-[1.1rem]" />
                  </UiIconButton>
                  <UiIconButton variant="primary" size="sm" title="Accept" onClick={() => onAcceptRequest(friend)}>
                    <CheckIcon className="!text-[1.1rem]" />
                  </UiIconButton>
                  <UiIconButton variant="danger" size="sm" title="Reject" onClick={() => onRejectRequest(friend)}>
                    <CloseIcon className="!text-[1.1rem]" />
                  </UiIconButton>
                </div>
              </div>
            ))}

          {currentFilter === "blocked" &&
            displayedFriends.map((friend) => (
              <div key={friend.id} className="flex items-center rounded-xl p-4 bg-[var(--card)] border border-[var(--border)] shadow-[0_2px_8px_rgba(0,0,0,0.28)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.32)] hover:bg-[var(--cardHover)] transition">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-zinc-200">
                  <BlockIcon className="!text-[1.5rem]" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center gap-2 text-base font-semibold text-zinc-100">
                    {friend.displayName}
                  </div>
                </div>
                <div className="flex gap-2">
                  <UiButton variant="outline" size="sm" pill onClick={() => onMoreActions(friend)}>
                    <span className="inline-flex items-center gap-2">
                      <LockOpenIcon className="!text-sm" />
                      Unblock
                    </span>
                  </UiButton>
                </div>
              </div>
            ))}

          {hasMore && (
            <div className="mt-5 flex justify-center">
              <UiButton variant="outline" pill disabled={isLoadingMore} onClick={onLoadMore}>
                {isLoadingMore ? "Loading..." : "Load More"}
              </UiButton>
            </div>
          )}
        </div>
      )}
    </div>
    <style jsx>{`
      /* Scoped custom scrollbar styling for FriendsList */
      .friends-scroll {
        scrollbar-width: thin; /* Firefox */
        scrollbar-color: #52525b transparent; /* thumb track */
      }
      .friends-scroll::-webkit-scrollbar {
        width: 10px;
      }
      .friends-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .friends-scroll::-webkit-scrollbar-thumb {
        background-color: #3f3f46; /* zinc-700 */
        border-radius: 8px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }
      .friends-scroll:hover::-webkit-scrollbar-thumb {
        background-color: #52525b; /* zinc-600 on hover */
      }
    `}</style>
    </>
  );
});

FriendsList.displayName = "FriendsList";

export default FriendsList;

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
import { themeVar } from "@/theme/registry";

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
        <div className="flex flex-1 flex-col items-center justify-center" style={{ color: themeVar("mutedForeground") }}>
          <div className="mb-4 h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: themeVar("border") }} />
          <p className="text-base">Loading friends...</p>
        </div>
      )}

      {/* Empty states */}
      {!isLoading && displayedFriends.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center text-center" style={{ color: themeVar("mutedForeground") }}>
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
                    className={[
                      "flex items-center rounded-xl p-4 transition",
                      "bg-[var(--card)] border border-[var(--border)]",
                    ].join(" ")}
                    style={{
                      backgroundColor: themeVar("card"),
                      borderColor: themeVar("border"),
                      boxShadow: `0 2px 8px color-mix(in oklab, ${themeVar("foreground")}, transparent 85%)`,
                      borderLeft: friend.isFavorite ? `4px solid ${themeVar("chart3")}` : undefined,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `color-mix(in oklab, ${themeVar("card")}, ${themeVar("foreground")} 3%)`;
                      e.currentTarget.style.boxShadow = `0 6px 18px color-mix(in oklab, ${themeVar("foreground")}, transparent 80%)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = themeVar("card");
                      e.currentTarget.style.boxShadow = `0 2px 8px color-mix(in oklab, ${themeVar("foreground")}, transparent 85%)`;
                    }}
                  >
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: themeVar("muted"), color: themeVar("foreground") }}>
                      {friend.avatarUrl ? (
                        <img src={friend.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <AccountBoxIcon className="!text-[2rem]" style={{ color: themeVar("mutedForeground") }} />
                      )}
                    </div>
    
                    <div className="ml-4 flex-1">
                      <div className="flex items-center gap-2 text-base font-semibold" style={{ color: themeVar("foreground") }}>
                        {friend.displayName}
                        {friend.isMuted && <VolumeOffIcon className="!text-sm" style={{ color: themeVar("mutedForeground") }} />}
                      </div>
                    </div>

                <div className="flex items-center gap-2.5">
                  <UiIconButton 
                    variant="primary" 
                    size="sm" 
                    onClick={() => onMessage(friend)} 
                    title="Message"
                    className="shadow-sm transition-transform active:scale-95"
                  >
                    <ChatBubbleOutlineIcon className="!text-[1.1rem]" />
                  </UiIconButton>
                  
                  <UiIconButton 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => onViewFullProfile(friend)} 
                    title="View Full Profile"
                    className="shadow-sm transition-transform active:scale-95"
                  >
                    <PersonIcon className="!text-[1.1rem]" />
                  </UiIconButton>
                  
                  <UiIconButton 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onMoreActions(friend)} 
                    title="More"
                    className="opacity-70 hover:opacity-100 transition-all"
                  >
                    <MoreHorizIcon className="!text-[1.2rem]" />
                  </UiIconButton>
                </div>
              </div>
            ))}

          {currentFilter === "pending" &&
            displayedFriends.map((friend) => (
              <div
                key={friend.id}
                className="mb-3 flex items-center rounded-xl p-4 transition"
                style={{
                  backgroundColor: themeVar("card"),
                  borderColor: themeVar("border"),
                  borderWidth: 1,
                  boxShadow: `0 2px 8px color-mix(in oklab, ${themeVar("foreground")}, transparent 85%)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `color-mix(in oklab, ${themeVar("card")}, ${themeVar("foreground")} 3%)`;
                  e.currentTarget.style.boxShadow = `0 6px 18px color-mix(in oklab, ${themeVar("foreground")}, transparent 80%)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = themeVar("card");
                  e.currentTarget.style.boxShadow = `0 2px 8px color-mix(in oklab, ${themeVar("foreground")}, transparent 85%)`;
                }}
              >
                <div className="h-12 w-12 overflow-hidden rounded-full" style={{ backgroundColor: themeVar("muted") }}>
                  <img
                    src={friend.avatarUrl || "/avatars/default/default_001.jpg"}
                    alt={`${friend.displayName}'s avatar`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center gap-2 text-base font-semibold" style={{ color: themeVar("foreground") }}>
                    {friend.displayName}
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
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
              <div key={friend.id} className="flex items-center rounded-xl p-4 transition"
                style={{
                  backgroundColor: themeVar("card"),
                  borderColor: themeVar("border"),
                  borderWidth: 1,
                  boxShadow: `0 2px 8px color-mix(in oklab, ${themeVar("foreground")}, transparent 85%)`,
                }}
              >
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: themeVar("muted"), color: themeVar("foreground") }}>
                  <BlockIcon className="!text-[1.5rem]" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center gap-2 text-base font-semibold" style={{ color: themeVar("foreground") }}>
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
        scrollbar-color: ${themeVar("mutedForeground")} transparent; /* thumb track */
      }
      .friends-scroll::-webkit-scrollbar {
        width: 10px;
      }
      .friends-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .friends-scroll::-webkit-scrollbar-thumb {
        background-color: color-mix(in oklab, ${themeVar("muted")}, transparent 20%);
        border-radius: 8px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }
      .friends-scroll:hover::-webkit-scrollbar-thumb {
        background-color: ${themeVar("mutedForeground")};
      }
    `}</style>
    </>
  );
});

FriendsList.displayName = "FriendsList";

export default FriendsList;



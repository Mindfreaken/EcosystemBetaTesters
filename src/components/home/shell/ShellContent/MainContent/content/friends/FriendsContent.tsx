"use client";

import React, { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Id } from "convex/_generated/dataModel";
import { useGetFriends } from "@/convex/friends/getFriends";
import { useGetFriendRequests } from "@/convex/friends/getFriendRequests";
import { useGetFriendDetails } from "@/convex/friends/getFriendDetails";
import { mapFriendDocToFriend, mapRequestDocToFriendRequest } from "@/convex/friends/mappers";
import type { Friend, FriendFilterType } from "@/convex/friends/types";
import FriendsHeader from "./FriendsHeader";
import FriendsList from "./FriendsList";
import AddFriendModal from "./AddFriendModal";
import FriendCodeModal from "./FriendCodeModal";
import FriendActionsModal from "./FriendActionsModal";
import ProfileCardModal from "../profile/components/ProfileCardModal";
import ReportUserModal from "./ReportUserModal";
import ProfileCollectionsModal from "../profile/components/ProfileCollectionsModal";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useRespondToFriendRequest } from "@/convex/friends/respondToFriendRequest";
import { useShellView } from "../../../viewContext";

// FriendsContent is the UI entry point for the Friends feature.
// Wired with Convex queries/mutations and Tailwind-based UI components.

const FriendsContent: React.FC = () => {
  const { user } = useUser();
  const clerkUserId = user?.id ?? null;
  const me = useQuery(api.users.onboarding.queries.me, {});
  const convexUserId = me?._id as Id<"users"> | undefined;
  const { setView, setSelectedChatId } = useShellView();

  const [currentFilter, setCurrentFilter] = useState<FriendFilterType>("all");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showFriendCode, setShowFriendCode] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);

  // Queries
  const activeFriends = useGetFriends({ clerkUserId, status: "active" }) as any[] | undefined;
  const blockedFriends = useGetFriends({ clerkUserId, status: "blocked" }) as any[] | undefined;
  const favoriteFriends = useGetFriends({ clerkUserId, isFavorite: true }) as any[] | undefined;
  const pendingRequestsRaw = useGetFriendRequests({ clerkUserId, type: "received", status: "pending" }) as any[] | undefined;
  const respondToRequest = useRespondToFriendRequest();
  const createOrGetChat = useMutation(api.chat.functions.chats.createOrGetChat);

  // Collect all friend convex IDs to fetch details
  const allFriendConvexIds = useMemo(() => {
    const ids = new Set<Id<"users">>();
    (activeFriends ?? []).forEach((f: any) => ids.add(f.friendId as Id<"users">));
    (blockedFriends ?? []).forEach((f: any) => ids.add(f.friendId as Id<"users">));
    (favoriteFriends ?? []).forEach((f: any) => ids.add(f.friendId as Id<"users">));
    return Array.from(ids);
  }, [activeFriends, blockedFriends, favoriteFriends]);

  const friendDetails = useGetFriendDetails(allFriendConvexIds);
  const friendDetailsMap = useMemo(() => {
    if (!friendDetails) return null as Map<Id<"users">, any> | null;
    const m = new Map<Id<"users">, any>();
    friendDetails.forEach((d) => m.set(d.userId, d));
    return m;
  }, [friendDetails]);

  // Map docs to UI models
  const activeMapped = useMemo(
    () => (activeFriends ?? []).map((doc: any) => mapFriendDocToFriend(doc, friendDetailsMap)),
    [activeFriends, friendDetailsMap]
  );
  const blockedMapped = useMemo(
    () => (blockedFriends ?? []).map((doc: any) => mapFriendDocToFriend(doc, friendDetailsMap)),
    [blockedFriends, friendDetailsMap]
  );
  const favoriteMapped = useMemo(
    () => (favoriteFriends ?? []).map((doc: any) => mapFriendDocToFriend(doc, friendDetailsMap)),
    [favoriteFriends, friendDetailsMap]
  );
  const pendingRequests = useMemo(
    () => (pendingRequestsRaw ?? []).map((doc: any) => mapRequestDocToFriendRequest(doc)),
    [pendingRequestsRaw]
  );

  // Convert pending requests into Friend-like entries for the list UI
  const pendingAsFriends: Friend[] = useMemo(() => {
    return (pendingRequests ?? []).map((req) => ({
      id: req.id,
      userId: req.senderConvexId,
      friendId: req.senderConvexId,
      username: req.senderUsername,
      displayName: req.senderDisplayName,
      avatarUrl: req.senderAvatarUrl,
      status: "pending",
      dateAdded: req.createdAt,
      isMuted: false,
      isFavorite: false,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
    }));
  }, [pendingRequests]);

  // Aggregate friends by filter
  const friendsByFilter = useMemo(() => {
    return {
      all: activeMapped ?? [],
      blocked: blockedMapped ?? [],
      favorite: favoriteMapped ?? [],
      pending: pendingAsFriends ?? [],
    } as Record<FriendFilterType, Friend[]>;
  }, [activeMapped, blockedMapped, favoriteMapped, pendingAsFriends]);

  const filters = useMemo(
    () => [
      { id: "all" as FriendFilterType, label: "All" },
      { id: "pending" as FriendFilterType, label: "Pending" },
      { id: "blocked" as FriendFilterType, label: "Blocked" },
      { id: "favorite" as FriendFilterType, label: "Favorites" },
    ],
    []
  );

  // Handlers
  const handleMessage = async (friend: Friend) => {
    if (!convexUserId) return;
    try {
      const chatId = await createOrGetChat({ participantIds: [friend.friendId], creatorId: convexUserId });
      // Navigate to the specific chat and reflect in URL
      setSelectedChatId(String(chatId));
      setView("chat");
    } catch (e) {
      console.error("createOrGetChat failed", e);
    }
  };

  const handleViewProfileCard = (friend: Friend) => {
    setSelectedFriend(friend);
    setShowProfileCard(true);
  };

  const handleMoreActions = (friend: Friend) => {
    setSelectedFriend(friend);
    setShowActions(true);
  };

  const handleViewCollections = (friend: Friend) => {
    setSelectedFriend(friend);
    setShowCollectionsModal(true);
  };

  const handleViewFullProfile = (friend: Friend) => {
    setSelectedFriend(friend);
    setShowProfileCard(true);
  };

  const handleAcceptRequest = async (friend: Friend) => {
    try {
      await respondToRequest({ requestId: friend.id as Id<"friendRequests">, response: "accepted" });
    } catch (e) {
      console.error("accept request failed", e);
    }
  };

  const handleRejectRequest = async (friend: Friend) => {
    try {
      await respondToRequest({ requestId: friend.id as Id<"friendRequests">, response: "rejected" });
    } catch (e) {
      console.error("reject request failed", e);
    }
  };

  const handleFriendUpdated = (_friend: Friend) => {
    // Data comes from queries; optimistic update can be handled in child components if needed
  };

  return (
    <div className="flex h-full w-full flex-col">
      <FriendsHeader
        currentFilter={currentFilter}
        setCurrentFilter={setCurrentFilter}
        unreadRequestsCount={pendingRequests?.length ?? 0}
        filters={filters}
        onAddFriend={() => setShowAddFriend(true)}
        onShowFriendCode={() => setShowFriendCode(true)}
      />

      {/* Make the list section take remaining height and scroll if needed */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <FriendsList
          friends={friendsByFilter[currentFilter] ?? []}
          currentFilter={currentFilter}
          isLoading={!clerkUserId}
          isLoadingMore={false}
          hasMore={false}
          onMessage={handleMessage}
          onViewProfileCard={handleViewProfileCard}
          onMoreActions={handleMoreActions}
          onLoadMore={() => {}}
          onAcceptRequest={handleAcceptRequest}
          onRejectRequest={handleRejectRequest}
          onFriendUpdated={handleFriendUpdated}
          onViewFullProfile={handleViewFullProfile}
          onViewCollections={handleViewCollections}
        />
      </div>

      {/* Modals */}
      {showAddFriend && (
        <AddFriendModal
          show={showAddFriend}
          onClose={() => setShowAddFriend(false)}
          onFriendAdded={() => { /* optional: trigger refetch if needed */ }}
        />
      )}
      {showFriendCode && (
        <FriendCodeModal show={showFriendCode} onClose={() => setShowFriendCode(false)} />
      )}
      {selectedFriend && (
        <ProfileCardModal
          show={showProfileCard}
          onClose={() => setShowProfileCard(false)}
          userId={selectedFriend.friendId as any}
          prefill={{
            displayName: selectedFriend.displayName,
            avatarUrl: (selectedFriend.avatarUrl ?? undefined) as string | undefined,
          }}
        />
      )}
      {selectedFriend && (
        <FriendActionsModal
          show={showActions}
          friend={selectedFriend}
          onClose={() => setShowActions(false)}
          onFriendUpdated={handleFriendUpdated}
          onViewProfile={handleViewProfileCard}
          onOpenChat={(id) => { setSelectedChatId(String(id)); setView("chat"); }}
          onReportUser={() => setShowReportModal(true)}
        />
      )}
      {selectedFriend && convexUserId && (
        <ReportUserModal
          show={showReportModal}
          onClose={() => setShowReportModal(false)}
          friend={selectedFriend}
          currentUserId={convexUserId}
          source="friends"
        />
      )}

      {showCollectionsModal && selectedFriend && (
        <ProfileCollectionsModal
          show={showCollectionsModal}
          onClose={() => setShowCollectionsModal(false)}
          userId={selectedFriend.friendId as any}
          prefill={{
            displayName: selectedFriend.displayName,
            avatarUrl: (selectedFriend.avatarUrl ?? undefined) as string | undefined,
          }}
        />
      )}
    </div>
  );
};

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-md border p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

export default FriendsContent;

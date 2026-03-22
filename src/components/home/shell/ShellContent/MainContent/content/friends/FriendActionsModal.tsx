"use client";
import React, { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Friend } from "@/convex/friends/types";
import { Id } from "convex/_generated/dataModel";

// Icons
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import BlockIcon from "@mui/icons-material/Block";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FlagIcon from "@mui/icons-material/Flag";
import CloseIcon from "@mui/icons-material/Close";
import UiButton from "@/components/ui/UiButton";
import UiIconButton from "@/components/ui/UiIconButton";

interface FriendActionsModalProps {
  show: boolean;
  friend: Friend;
  onClose: () => void;
  onFriendUpdated: (friend: Friend) => void;
  onViewProfile: (friend: Friend) => void;
  onReportUser?: (friend: Friend) => void;
  onOpenChat?: (chatId: Id<"chats">) => void;
}

const FriendActionsModal: React.FC<FriendActionsModalProps> = ({
  show,
  friend,
  onClose,
  onFriendUpdated,
  onViewProfile,
  onReportUser,
  onOpenChat,
}) => {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [confirmMute, setConfirmMute] = useState(false);

  // Current user (Convex via Clerk)
  const me = useQuery(api.users.onboarding.queries.me, {});
  const userId = me?._id as Id<"users"> | undefined;

  // Friendship record between me and friend
  const friendship = useQuery(
    api.users.friends.functions.getFriendship.getFriendship,
    userId && friend.friendId
      ? ({ userId, friendId: friend.friendId as Id<"users"> } as any)
      : ("skip" as any)
  );

  // Mutations
  const toggleMute = useMutation(api.users.friends.functions.toggleFriendMute.toggleFriendMute);
  const toggleFavorite = useMutation(
    api.users.friends.functions.toggleFriendFavorite.toggleFriendFavorite
  );
  const updateFriendStatus = useMutation(
    api.users.friends.functions.updateFriendStatus.updateFriendStatus
  );
  const createOrGetChat = useMutation(
    api.chat.functions.chats.createOrGetChat
  );

  const friendshipId = useMemo(() => friendship?._id as Id<"friends"> | undefined, [friendship]);

  // Actions
  const handleToggleMute = async () => {
    if (!friendshipId) return;
    setErrorMessage("");
    setIsLoading(true);
    try {
      onFriendUpdated({ ...friend, isMuted: !friend.isMuted });
      await toggleMute({ friendshipId });
      onClose();
    } catch (e: any) {
      onFriendUpdated(friend); // revert
      setErrorMessage(e?.message || "Failed to toggle mute");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!friendshipId) return;
    setErrorMessage("");
    setIsLoading(true);
    try {
      onFriendUpdated({ ...friend, isFavorite: !friend.isFavorite });
      await toggleFavorite({ friendshipId });
      onClose();
    } catch (e: any) {
      onFriendUpdated(friend);
      setErrorMessage(e?.message || "Failed to toggle favorite");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!friendshipId) {
      setErrorMessage("Friendship record not found");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    try {
      await updateFriendStatus({ friendshipId, status: "removed" });
      onFriendUpdated({ ...friend, status: "removed" as any });
      onClose();
    } catch (e: any) {
      setErrorMessage(e?.message || "Failed to remove friend");
    } finally {
      setIsLoading(false);
      setConfirmRemove(false);
    }
  };

  const handleBlockUser = async () => {
    if (!friendshipId) {
      setErrorMessage("Friendship record not found");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    try {
      await updateFriendStatus({ friendshipId, status: "blocked" });
      onFriendUpdated({ ...friend, status: "blocked" as any });
      onClose();
    } catch (e: any) {
      setErrorMessage(e?.message || "Failed to block user");
    } finally {
      setIsLoading(false);
      setConfirmBlock(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!friendshipId) {
      setErrorMessage("Friendship record not found");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    try {
      await updateFriendStatus({ friendshipId, status: "active" });
      onFriendUpdated({ ...friend, status: "active" as any });
      onClose();
    } catch (e: any) {
      setErrorMessage(e?.message || "Failed to unblock user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userId) return;
    try {
      const chatId = await createOrGetChat({
        participantIds: [friend.friendId as Id<"users">],
        creatorId: userId,
      });
      onOpenChat?.(chatId as Id<"chats">);
      onClose();
    } catch (e) {
      setErrorMessage("Failed to create or get chat");
    }
  };

  if (!show) return null;

  const ActionItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }> = ({ icon, label, onClick, danger }) => (
    <UiButton
      onClick={onClick}
      variant={danger ? "danger" : "outline"}
      className="w-full justify-start gap-3"
      pill
      size="md"
      disabled={isLoading}
      startIcon={<span className="text-[1.1rem]">{icon}</span>}
    >
      {label}
    </UiButton>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h3 className="text-base font-semibold">{friend.displayName} - Actions</h3>
          <UiIconButton size="sm" variant="ghost" aria-label="Close" onClick={onClose} title="Close">
            <CloseIcon className="!text-[1.1rem]" />
          </UiIconButton>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-4">
          {errorMessage && (
            <div className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{errorMessage}</div>
          )}

          <ActionItem icon={<AccountCircleIcon />} label="View Profile" onClick={() => { onViewProfile(friend); onClose(); }} />
          <ActionItem icon={<ChatBubbleOutlineIcon />} label="Send Message" onClick={handleSendMessage} />
          <ActionItem
            icon={friend.isMuted ? <VolumeUpIcon /> : <VolumeOffIcon />}
            label={friend.isMuted ? "Unmute" : "Mute"}
            onClick={() => setConfirmMute(true)}
          />
          <ActionItem
            icon={friend.isFavorite ? <StarIcon /> : <StarBorderIcon />}
            label={friend.isFavorite ? "Unfavorite" : "Favorite"}
            onClick={handleToggleFavorite}
          />
          {friend.status === ("blocked" as any) ? (
            <ActionItem icon={<LockOpenIcon />} label="Unblock User" onClick={handleUnblockUser} danger />
          ) : (
            <ActionItem icon={<BlockIcon />} label="Block User" onClick={() => setConfirmBlock(true)} danger />
          )}
          <ActionItem icon={<DeleteOutlineIcon />} label="Remove Friend" onClick={() => setConfirmRemove(true)} danger />
          {onReportUser && (
            <ActionItem icon={<FlagIcon />} label="Report User" onClick={() => onReportUser(friend)} />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-zinc-800 px-5 py-3">
          <UiButton variant="outline" size="sm" pill onClick={onClose}>Close</UiButton>
        </div>
      </div>

      {/* Simple confirms */}
      {confirmRemove && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={() => setConfirmRemove(false)}>
          <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-zinc-100" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 text-base font-semibold">Remove Friend</div>
            <div className="mb-4 text-sm text-zinc-300">Are you sure you want to remove {friend.displayName}?</div>
            <div className="flex justify-end gap-2">
              <UiButton variant="outline" size="sm" pill onClick={() => setConfirmRemove(false)}>Cancel</UiButton>
              <UiButton variant="danger" size="sm" pill onClick={handleRemoveFriend} disabled={isLoading}>Remove</UiButton>
            </div>
          </div>
        </div>
      )}

      {confirmBlock && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={() => setConfirmBlock(false)}>
          <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-zinc-100" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 text-base font-semibold">Block User</div>
            <div className="mb-4 text-sm text-zinc-300">Block {friend.displayName}? You won't receive messages from them.</div>
            <div className="flex justify-end gap-2">
              <UiButton variant="outline" size="sm" pill onClick={() => setConfirmBlock(false)}>Cancel</UiButton>
              <UiButton variant="danger" size="sm" pill onClick={handleBlockUser} disabled={isLoading}>Block</UiButton>
            </div>
          </div>
        </div>
      )}

      {confirmMute && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={() => setConfirmMute(false)}>
          <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-zinc-100" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 text-base font-semibold">{friend.isMuted ? "Unmute" : "Mute"} User</div>
            <div className="mb-4 text-sm text-zinc-300">{friend.isMuted ? "Unmute" : "Mute"} {friend.displayName}?</div>
            <div className="flex justify-end gap-2">
              <UiButton variant="outline" size="sm" pill onClick={() => setConfirmMute(false)}>Cancel</UiButton>
              <UiButton variant="primary" size="sm" pill onClick={() => { setConfirmMute(false); handleToggleMute(); }} disabled={isLoading}>{friend.isMuted ? "Unmute" : "Mute"}</UiButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendActionsModal;



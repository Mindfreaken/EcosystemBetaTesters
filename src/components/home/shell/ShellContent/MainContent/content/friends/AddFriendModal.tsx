"use client";
import React, { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import CloseIcon from "@mui/icons-material/Close";
import CircularProgress from "@mui/material/CircularProgress";
import UiIconButton from "@/components/ui/UiIconButton";
import UiButton from "@/components/ui/UiButton";

interface AddFriendModalProps {
  show: boolean;
  onClose: () => void;
  onFriendAdded: () => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ show, onClose, onFriendAdded }) => {
  const [codeInput, setCodeInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Current user from Convex (via Clerk)
  const me = useQuery(api.users.onboarding.queries.me, {});
  const userId = me?._id as Id<"users"> | undefined;

  const addFriendByCode = useMutation(
    api.users.friends.functions.addFriendByCode.addFriendByCode
  );

  const canSubmit = useMemo(() => !!codeInput.trim() && !!userId && !isSubmitting, [codeInput, userId, isSubmitting]);

  const getPrettyErrorMessage = (e: any) => {
    const raw = (e?.message ?? e?.toString?.() ?? "Unknown error").toString();
    // Strip Convex SDK prefixes like "[CONVEX ...] Server Error" and "Uncaught Error:"
    let msg = raw
      .replace(/\[CONVEX[^\]]*\]\s*/i, "")
      .replace(/Server Error\s*/i, "")
      .replace(/Uncaught Error:\s*/i, "")
      .trim();
    // Friendly remaps for common cases
    if (/Invalid or expired friend code/i.test(msg)) {
      msg = "That code doesn't look valid anymore. Try a fresh one?";
    } else if (/already friends/i.test(msg)) {
      msg = "You're already friends with this user.";
    } else if (/request already exists/i.test(msg)) {
      msg = "A friend request is already pending.";
    } else if (/can't add yourself|cannot add yourself/i.test(msg)) {
      msg = "Hey silly goose, you can't add yourself as a friend.";
    }
    return msg;
  };

  const handleSendRequest = async () => {
    if (!canSubmit) return;
    if (!userId) return;
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);
    try {
      await addFriendByCode({ userId, code: codeInput.trim().toUpperCase() });
      setSuccessMessage("Friend request sent successfully");
      setCodeInput("");
      onFriendAdded?.();
      setTimeout(() => onClose?.(), 1500);
    } catch (e: any) {
      setErrorMessage(getPrettyErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-semibold">Add Friend</h2>
          <UiIconButton size="sm" variant="ghost" onClick={onClose} title="Close">
            <CloseIcon className="!text-[1.1rem]" />
          </UiIconButton>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="mb-3 text-sm text-zinc-400">Enter a friend code to send a request</p>
          <div className="flex gap-3">
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              type="text"
              placeholder="Enter friend code"
              onKeyUp={(e) => e.key === "Enter" && handleSendRequest()}
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
            />
            <UiButton
              variant="primary"
              size="sm"
              pill
              disabled={!canSubmit}
              loading={isSubmitting}
              onClick={handleSendRequest}
            >
              Send Request
            </UiButton>
          </div>

          {errorMessage && (
            <div className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{errorMessage}</div>
          )}
          {successMessage && (
            <div className="mt-3 rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-400">{successMessage}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddFriendModal;

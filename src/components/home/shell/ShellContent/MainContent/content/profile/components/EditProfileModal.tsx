"use client";

import React, { useEffect, useMemo, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import CircularProgress from "@mui/material/CircularProgress";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import AvatarCoverPickerModal from "./AvatarCoverPickerModal";

interface EditProfileModalProps {
  show: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ show, onClose }: EditProfileModalProps) {
  const me = useQuery(api.users.onboarding.queries.me, {});
  const updateProfile = useMutation(
    api.users.profiles.functions.updateProfile.updateProfile as any
  );

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [customStatus, setCustomStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pickerMode, setPickerMode] = useState<"avatar" | "cover" | null>(null);

  useEffect(() => {
    if (show && me) {
      setDisplayName(((me as any).displayName || "").slice(0, 20));
      setUsername(((me as any).username || "").slice(0, 20));
      setBio((me as any).bio || "");
      setCustomStatus((me as any).customStatus || "");
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, [show, me]);

  const canSubmit = useMemo(() => {
    return (
      !!me?._id &&
      !isSubmitting &&
      !!displayName.trim() &&
      !!username.trim() &&
      displayName.length <= 20 &&
      username.length <= 20 &&
      customStatus.length <= 60 &&
      bio.length <= 280
    );
  }, [me?._id, isSubmitting, displayName, username, customStatus, bio]);

  const prettyError = (e: any) => {
    const raw = (e?.message ?? e?.toString?.() ?? "Unknown error").toString();
    return raw.replace(/\[CONVEX[^\]]*\]\s*/i, "").replace(/Uncaught Error:\s*/i, "").trim();
  };

  const onSave = async () => {
    if (!canSubmit || !me?._id) return;
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await updateProfile({
        userId: me._id as Id<"users">,
        profileData: {
          displayName: displayName.trim(),
          username: username.trim(),
          bio: bio,
          customStatus: customStatus,
        },
      });
      setSuccessMessage("Profile updated");
      setTimeout(() => onClose?.(), 900);
    } catch (e: any) {
      setErrorMessage(prettyError(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-semibold">Edit Profile</h2>
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center justify-center rounded-xl border border-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800/60"
              onClick={() => setPickerMode("cover")}
            >
              Change Cover
            </button>
            <button
              className="inline-flex items-center justify-center rounded-xl border border-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800/60"
              onClick={() => setPickerMode("avatar")}
            >
              Change Avatar
            </button>
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              onClick={onClose}
              aria-label="Close"
            >
              <CloseIcon className="!text-[1.1rem]" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-400">Display Name</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 20))}
                placeholder="Your display name"
                maxLength={20}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-400">Username</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.slice(0, 20))}
                placeholder="username"
                maxLength={20}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">Custom Status</span>
            <input
              value={customStatus}
              onChange={(e) => setCustomStatus(e.target.value.slice(0, 60))}
              placeholder="What are you up to?"
              maxLength={60}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">Bio</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 280))}
              placeholder="Tell us a bit about yourself"
              rows={4}
              maxLength={280}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
            />
          </label>

          {errorMessage ? (
            <div className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{errorMessage}</div>
          ) : null}
          {successMessage ? (
            <div className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-400">{successMessage}</div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800/60"
            >
              Cancel
            </button>
            <button
              disabled={!canSubmit}
              onClick={onSave}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <CircularProgress size="1em" color="inherit" /> : <span>Save Changes</span>}
            </button>
          </div>
        </div>
        <AvatarCoverPickerModal
          show={pickerMode !== null}
          mode={(pickerMode ?? "avatar") as any}
          onClose={() => setPickerMode(null)}
        />
      </div>
    </div>
  );
}



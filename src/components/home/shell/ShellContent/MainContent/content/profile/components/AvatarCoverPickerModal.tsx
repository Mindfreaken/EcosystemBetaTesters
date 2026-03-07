"use client";

import React, { useMemo, useRef, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import CircularProgress from "@mui/material/CircularProgress";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

export type PickerMode = "avatar" | "cover";

interface AvatarCoverPickerModalProps {
  show: boolean;
  mode: PickerMode;
  onClose: () => void;
}

export default function AvatarCoverPickerModal({ show, mode, onClose }: AvatarCoverPickerModalProps) {
  const me = useQuery(api.users.onboarding.queries.me, {});
  const userId = me?._id as Id<"users"> | undefined;

  const generateUploadUrl = useMutation(api.chat.storage.generateUploadUrl);
  const saveFileMetadata = useMutation(api.chat.storage.saveFileMetadata as any);
  const updateProfile = useMutation(api.users.profiles.functions.updateProfile.updateProfile as any);

  const [activeTab, setActiveTab] = useState<"upload" | "defaults">("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const defaults = useMemo(() => {
    if (mode === "avatar") {
      return Array.from({ length: 15 }).map((_, i) => `/avatars/default/default_${String(i + 1).padStart(3, "0")}.jpg`);
    }
    return Array.from({ length: 18 }).map((_, i) => `/covers/default/default_${String(i + 1).padStart(3, "0")}.png`);
  }, [mode]);

  const label = mode === "avatar" ? "Avatar" : "Cover";

  const handlePickDefault = async (url: string) => {
    if (!userId) return;
    setErrorMessage("");
    try {
      await updateProfile({
        userId,
        profileData: mode === "avatar" ? { avatarUrl: url } : { coverUrl: url },
      });
      onClose?.();
    } catch (e: any) {
      setErrorMessage((e?.message ?? "Failed to update profile").toString());
    }
  };

  const handleUpload = async (file: File) => {
    if (!userId) return;
    setIsUploading(true);
    setErrorMessage("");
    try {
      // Get upload URL
      const res = await generateUploadUrl({ fileSize: file.size });
      if (!(res as any)?.success) throw new Error("Failed to get upload URL");
      const url = (res as any).url as string;

      // Upload to storage
      const uploadResp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResp.ok) throw new Error("Upload failed");
      const json = await uploadResp.json();
      const storageId = json.storageId as string;

      // Save metadata
      const meta = await saveFileMetadata({
        storageId: storageId as any,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        userId,
        path: `users/${userId}/${mode}`,
      });

      const publicUrl = (meta as any).url as string;

      // Patch profile with new URL
      await updateProfile({
        userId,
        profileData: mode === "avatar" ? { avatarUrl: publicUrl } : { coverUrl: publicUrl },
      });

      onClose?.();
    } catch (e: any) {
      setErrorMessage((e?.message ?? e?.toString?.() ?? "Unknown error").toString());
    } finally {
      setIsUploading(false);
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
          <h2 className="text-lg font-semibold">Change {label}</h2>
          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            onClick={onClose}
          >
            <CloseIcon className="!text-[1.1rem]" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="mb-4 flex gap-3">
            <button
              onClick={() => setActiveTab("upload")}
              className={`rounded-xl px-3 py-2 text-sm ${activeTab === "upload" ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-800/50"}`}
            >
              Upload
            </button>
            <button
              onClick={() => setActiveTab("defaults")}
              className={`rounded-xl px-3 py-2 text-sm ${activeTab === "defaults" ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-800/50"}`}
            >
              Choose from defaults
            </button>
          </div>
        </div>

        {activeTab === "upload" ? (
          <div className="px-6 pb-6">
            <input
              ref={inputRef}
              type="file"
              accept={mode === "avatar" ? "image/png,image/jpeg" : "image/png,image/jpeg"}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f);
              }}
              className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-10 text-sm text-zinc-100 outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-zinc-100 hover:file:bg-zinc-700"
            />
            <p className="mt-2 text-xs text-zinc-400">PNG or JPG. Large images may be compressed.</p>
          </div>
        ) : (
          <div className="px-6 pb-6">
            <div className={mode === "avatar" ? "grid grid-cols-6 gap-3" : "grid grid-cols-3 gap-3"}>
              {defaults.map((src) => (
                <button
                  key={src}
                  onClick={() => void handlePickDefault(src)}
                  className={
                    mode === "avatar"
                      ? "group relative overflow-hidden rounded-full border border-zinc-800 hover:border-zinc-700 w-20 h-20"
                      : "group relative overflow-hidden rounded-xl border border-zinc-800 hover:border-zinc-700"
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt="default"
                    className={
                      mode === "avatar"
                        ? "block h-full w-full object-cover"
                        : "block h-20 w-full object-cover"
                    }
                  />
                  <div className="absolute inset-0 hidden items-center justify-center bg-black/40 group-hover:flex">
                    <span className="rounded-lg bg-zinc-900/70 px-2 py-1 text-xs">Use this</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {errorMessage ? (
          <div className="px-6 pb-4">
            <div className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{errorMessage}</div>
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4">
          <div className="text-xs text-zinc-400">{isUploading ? "Uploading…" : ""}</div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800/60"
            >
              Close
            </button>
            <button disabled className="inline-flex items-center justify-center rounded-xl bg-zinc-600 px-4 py-2 text-sm font-medium text-white opacity-50">
              {isUploading ? <CircularProgress size="1em" color="inherit" /> : <span>Done</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

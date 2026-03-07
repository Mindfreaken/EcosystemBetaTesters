"use client";
import React from "react";

interface ConfirmBlockUserDialogProps {
  friendName: string;
  isActionLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmBlockUserDialog: React.FC<ConfirmBlockUserDialogProps> = ({
  friendName,
  isActionLoading,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-zinc-100">
      <div className="mb-3 text-base font-semibold">Block User</div>
      <div className="mb-4 text-sm text-zinc-300">
        Block {friendName}? You won't receive messages from them.
      </div>
      <div className="flex justify-end gap-2">
        <button
          className="rounded-xl border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800"
          onClick={onCancel}
          disabled={isActionLoading}
        >
          Cancel
        </button>
        <button
          className="rounded-xl bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-500 disabled:opacity-60"
          onClick={onConfirm}
          disabled={isActionLoading}
        >
          {isActionLoading ? "Blocking..." : "Block"}
        </button>
      </div>
    </div>
  );
};

export default ConfirmBlockUserDialog;

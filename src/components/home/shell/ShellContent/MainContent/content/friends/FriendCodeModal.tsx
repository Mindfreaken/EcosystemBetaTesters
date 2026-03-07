import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SyncIcon from "@mui/icons-material/Sync";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import UiIconButton from "@/components/ui/UiIconButton";
import UiButton from "@/components/ui/UiButton";

interface FriendCodeModalProps {
  show: boolean;
  onClose: () => void;
}

const FriendCodeModal: React.FC<FriendCodeModalProps> = ({ show, onClose }) => {
  const [showActualCode, setShowActualCode] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Current user (Convex via Clerk auth)
  const me = useQuery(api.users.onboarding.queries.me, {});
  const userId = me?._id;

  // Active friend code for current user
  const activeCode = useQuery(
    api.users.friends.functions.getActiveCode.getActiveCode,
    userId ? { userId } : ("skip" as any)
  );

  const generateNewCode = useMutation(
    api.users.friends.functions.generateNewCode.generateNewCode
  );

  const isLoading = useMemo(() => activeCode === undefined, [activeCode]);

  const handleToggleCodeVisibility = () => {
    if (!activeCode) return;
    setShowActualCode((s) => !s);
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 5000);
  };

  const handleCopyCode = async () => {
    if (!activeCode) return;
    try {
      await navigator.clipboard.writeText(activeCode.code);
      showSuccess("Friend code copied to clipboard");
    } catch (e) {
      setShowActualCode(true);
      showError("Copy failed. Please copy manually.");
    }
  };

  const handleGenerateCode = async () => {
    if (!userId) {
      showError("User not found. Please sign in again.");
      return;
    }
    try {
      const newCode = await generateNewCode({ userId });
      setShowActualCode(false);
      try {
        if (newCode?.code) {
          await navigator.clipboard.writeText(newCode.code);
          showSuccess("New friend code generated and copied");
        } else {
          showSuccess("New friend code generated");
        }
      } catch {
        showSuccess("New friend code generated");
      }
    } catch (e) {
      showError("Failed to generate friend code. Try again later.");
    }
  };

  // Auto-generate if none exists when opening
  useEffect(() => {
    if (show && userId && activeCode === null) {
      handleGenerateCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, userId, activeCode]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-lg font-semibold">My Friend Code</h2>
          <UiIconButton size="sm" variant="ghost" onClick={onClose} title="Close">
            <CloseIcon className="!text-[1.1rem]" />
          </UiIconButton>
        </div>

        {/* Content */}
        <div className="space-y-4 px-5 py-5">
          <p className="text-sm text-zinc-400">
            Share your friend code to let others add you. You can generate a new code at any time.
          </p>

          <div className="space-y-2">
            <span className="text-xs text-zinc-400">My Friend Code:</span>
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
              <span className="select-all font-mono text-base font-semibold tracking-wide">
                {isLoading
                  ? "Loading..."
                  : showActualCode
                  ? activeCode?.code || "No code"
                  : activeCode?.code
                  ? "••••••••"
                  : "No code generated"}
              </span>
              <div className="flex items-center gap-1">
                <UiIconButton
                  onClick={handleToggleCodeVisibility}
                  title={showActualCode ? "Hide code" : "Show code"}
                  disabled={!activeCode || isLoading}
                  size="sm"
                  variant="ghost"
                >
                  {showActualCode ? (
                    <VisibilityOffIcon className="!text-[1rem]" />
                  ) : (
                    <VisibilityIcon className="!text-[1rem]" />
                  )}
                </UiIconButton>
                {activeCode && (
                  <UiIconButton onClick={handleCopyCode} title="Copy code" size="sm" variant="ghost">
                    <ContentCopyIcon className="!text-[1rem]" />
                  </UiIconButton>
                )}
                <UiIconButton
                  onClick={handleGenerateCode}
                  title={isLoading ? "Loading..." : activeCode ? "Generate new code" : "Generate code"}
                  disabled={isLoading}
                  size="sm"
                  variant="ghost"
                >
                  <SyncIcon className="!text-[1rem]" />
                </UiIconButton>
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-400">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-zinc-800 px-5 py-4">
          <UiButton variant="primary" size="sm" pill onClick={onClose}>
            Done
          </UiButton>
        </div>
      </div>
    </div>
  );
};

export default FriendCodeModal;

"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import type { Friend } from "@/convex/friends/types";

import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import WarningIcon from "@mui/icons-material/Warning";
import PersonIcon from "@mui/icons-material/Person";
import ReportIcon from "@mui/icons-material/Report";

const REPORT_REASONS = [
  "Harassment or bullying",
  "Inappropriate content",
  "Impersonation",
  "Spam",
  "Scam or fraud",
  "Other",
];

interface ReportUserModalProps {
  show: boolean;
  onClose: () => void;
  friend: Friend;
  currentUserId: Id<"users">;
  source?: string; // 'profile' | 'chat' | 'friends' | ...
}

const ReportUserModal: React.FC<ReportUserModalProps> = ({
  show,
  onClose,
  friend,
  currentUserId,
  source = "friends",
}) => {
  const submitReportMutation = useMutation(api.hub.overseer.reportUser);

  const [selectedReason, setSelectedReason] = useState<string>("");
  const [additionalDetails, setAdditionalDetails] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [acceptedWarning, setAcceptedWarning] = useState(false);

  if (!show) return null;

  const getSourceDisplayName = () => {
    switch (source) {
      case "profile":
        return "User Profile";
      case "chat":
        return "Chat";
      case "friends":
        return "Friends List";
      default:
        return source.charAt(0).toUpperCase() + source.slice(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReason) {
      setError("Please select a reason for your report");
      return;
    }
    if (!acceptedWarning) {
      setError("Please acknowledge the warning about false reports");
      return;
    }
    if (additionalDetails.length < 20) {
      setError("Please provide more details about the issue (at least 20 characters)");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const content = `Report Reason: ${selectedReason}\nUser Details: ${friend.displayName}\nReport Source: ${getSourceDisplayName()}\nReporter's Description: ${additionalDetails}`.trim();

      await submitReportMutation({
        targetUserId: friend.friendId as Id<"users">,
        reason: selectedReason,
        content,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSelectedReason("");
        setAdditionalDetails("");
        setAcceptedWarning(false);
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error("Error submitting report:", err);
      setError(err?.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-background p-5 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ReportIcon className="text-amber-500" />
            <h3 className="m-0 text-base font-semibold">Report User</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center text-emerald-600">
            <h4 className="mb-2 text-lg font-semibold">Report Submitted Successfully</h4>
            <p className="text-sm text-muted-foreground">
              Thank you for helping keep our community safe. Our moderation team will review your report.
            </p>
          </div>
        ) : (
          <>
            {/* Profile snippet */}
            <div className="mb-5 rounded-lg border bg-muted/40 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-background">
                  {friend.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={friend.avatarUrl} alt={friend.displayName} className="h-full w-full object-cover" />
                  ) : (
                    <PersonIcon className="text-muted-foreground" fontSize="large" />
                  )}
                </div>
                <div>
                  <h4 className="m-0 text-base font-semibold">{friend.displayName}</h4>
                </div>
              </div>
              <div className="mt-2 inline-block rounded bg-primary/10 px-2 py-1 text-xs text-muted-foreground">
                Reporting from: {getSourceDisplayName()}
              </div>
            </div>

            {/* Warning */}
            <div className="mb-5 flex gap-3 rounded-lg border border-amber-300/60 bg-amber-50/60 p-4 text-amber-700 dark:border-amber-400/30 dark:bg-amber-900/20 dark:text-amber-300">
              <WarningIcon className="mt-0.5" />
              <div>
                <p className="mb-2 text-sm font-semibold">Important Notice:</p>
                <p className="m-0 text-sm">
                  False or malicious reports are taken seriously and may result in actions against your account, including potential
                  suspension or social score penalties. Please ensure your report is accurate and includes sufficient details.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Reasons */}
              <div>
                <label className="mb-2 block text-sm font-semibold">Reason for Report:</label>
                <div className="flex flex-col gap-2">
                  {REPORT_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 ${selectedReason === reason ? "border-primary bg-primary/5" : "border-border"
                        }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={reason}
                        checked={selectedReason === reason}
                        onChange={() => setSelectedReason(reason)}
                      />
                      <span className="text-sm">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Detailed Description: <span className="font-normal text-muted-foreground">(minimum 20 characters)</span>
                </label>
                <textarea
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  placeholder={
                    "Please provide specific details about the issue. Include relevant information such as:\n- What happened?\n- When did it occur?\n- Were there any witnesses?\n- Any other context that might help our investigation"
                  }
                  className="min-h-[140px] w-full resize-vertical rounded-lg border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
                <div
                  className={`mt-1 flex justify-between text-xs ${additionalDetails.length < 20 ? "text-red-600" : "text-emerald-600"
                    }`}
                >
                  <span>{additionalDetails.length} / 20 characters minimum</span>
                  {additionalDetails.length < 20 && <span>Please provide more details</span>}
                </div>
              </div>

              {/* Acknowledgement */}
              <div>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={acceptedWarning} onChange={() => setAcceptedWarning(!acceptedWarning)} />
                  <span>I understand that submitting false reports may result in actions against my account</span>
                </label>
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 p-2 text-sm text-red-600 dark:text-red-400">{error}</div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedReason || !acceptedWarning || additionalDetails.length < 20}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <SendIcon fontSize="small" />
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportUserModal;



"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { UiButton } from "@/components/ui/UiButton";
import { MuiCard } from "@/components/ui/MuiCard";
import { Lock, LogOut, Clock } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";

interface BannedScreenProps {
    status: string;
    reason?: string;
    bannedUntil?: number;
}

const getStatusText = (s: string | undefined) => {
    switch (s) {
        case "suspensionStage1": return "Account Suspended";
        case "suspensionStageActive": return "Account Suspended";
        case "suspensionStageAppeal": return "Appeal Pending";
        case "suspensionStageAppealDenied": return "Appeal Denied";
        case "suspensionStageAppealWon": return "Appeal Approved";
        case "suspensionStageFalse": return "Suspension Invalidated";
        case undefined: return "Active";
        default: return s;
    }
};

export function BannedScreen({ status, reason, bannedUntil }: BannedScreenProps) {
    const { signOut } = useClerk();
    const [appealReason, setAppealReason] = useState("");
    const [appealLink, setAppealLink] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(status === "suspensionStageAppeal");
    const { toast } = useToast();

    const submitAppeal = useMutation(api.users.suspensionFunctions.submitAppeal);
    const history = useQuery(api.users.suspensionFunctions.getMySuspensionHistory);

    const handleAppeal = async () => {
        if (!appealReason) return;
        setIsSubmitting(true);
        try {
            await submitAppeal({ reason: appealReason, proofLink: appealLink });
            setIsSubmitted(true);
            toast({
                title: "Appeal Submitted",
                description: "Your appeal has been successfully received and is under review.",
            });
        } catch (error) {
            console.error("Failed to submit appeal:", error);
            toast({
                title: "Submission Failed",
                description: "Failed to submit appeal. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isBanned = status === "suspensionStageActive";
    const title = isBanned ? "BANNED" : "SUSPENDED";

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[color:var(--background)] text-[color:var(--foreground)] p-4">
            <div className="w-full max-w-3xl space-y-4">
                {/* Main Status Card */}
                <MuiCard
                    className="backdrop-blur"
                    style={{
                        backgroundColor: "color-mix(in oklab, var(--card), transparent 20%)",
                        borderColor: "var(--danger)",
                        borderWidth: "2px"
                    }}
                    variant="elevated"
                >
                    <div className="p-6">
                        {/* Title */}
                        <div className="text-center mb-6">
                            <div
                                className="mx-auto mb-4 p-4 rounded-full w-fit flex items-center justify-center"
                                style={{ backgroundColor: "color-mix(in oklab, var(--danger), transparent 80%)" }}
                            >
                                <Lock className="w-12 h-12" style={{ color: "var(--danger)" }} />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--danger)" }}>
                                {title}
                            </h1>
                        </div>

                        {/* Current Status Info */}
                        <div className="space-y-4 mb-6">
                            <div className="text-center">
                                <p className="text-sm font-medium mb-1" style={{ color: "var(--textMuted)" }}>
                                    Current Status
                                </p>
                                <p className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                                    {getStatusText(status)}
                                </p>
                            </div>

                            {reason && (
                                <div
                                    className="p-4 rounded"
                                    style={{
                                        backgroundColor: "color-mix(in oklab, var(--danger), transparent 90%)",
                                        border: "1px solid color-mix(in oklab, var(--danger), transparent 50%)",
                                    }}
                                >
                                    <p className="text-sm font-medium mb-1" style={{ color: "var(--danger)" }}>
                                        Reason
                                    </p>
                                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                                        {reason}
                                    </p>
                                </div>
                            )}

                            {bannedUntil && (
                                <div className="text-center">
                                    <p className="text-sm" style={{ color: "var(--textMuted)" }}>
                                        Suspension expires: {new Date(bannedUntil).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Appeal Section */}
                        {(status === "suspensionStage1" || status === "suspensionStageActive") && !isSubmitted && (
                            <div className="space-y-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                                <h3 className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>Submit Appeal</h3>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                                        Why should this suspension be lifted?
                                    </label>
                                    <textarea
                                        placeholder="Explain your case..."
                                        value={appealReason}
                                        onChange={(e) => setAppealReason(e.target.value)}
                                        className="flex min-h-[80px] w-full rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                        style={{
                                            backgroundColor: "var(--muted)",
                                            borderColor: "var(--border)",
                                            borderWidth: "1px",
                                            color: "var(--foreground)",
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                                        Proof Link (Optional)
                                    </label>
                                    <input
                                        className="flex h-9 w-full rounded-md px-3 py-1 text-sm"
                                        placeholder="https://..."
                                        value={appealLink}
                                        onChange={(e) => setAppealLink(e.target.value)}
                                        style={{
                                            backgroundColor: "var(--muted)",
                                            borderColor: "var(--border)",
                                            borderWidth: "1px",
                                            color: "var(--foreground)"
                                        }}
                                    />
                                </div>
                                <UiButton
                                    onClick={handleAppeal}
                                    disabled={isSubmitting || !appealReason}
                                    className="w-full font-bold shadow-lg"
                                    variant="danger"
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Appeal"}
                                </UiButton>
                            </div>
                        )}

                        {isSubmitted && (
                            <div
                                className="p-4 rounded text-center"
                                style={{
                                    backgroundColor: "color-mix(in oklab, var(--info), transparent 90%)",
                                    border: "1px solid color-mix(in oklab, var(--info), transparent 50%)"
                                }}
                            >
                                <p className="font-semibold mb-2" style={{ color: "var(--info)" }}>Appeal Submitted</p>
                                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                                    Our moderation team is reviewing your case. You will be notified when a decision is made.
                                </p>
                            </div>
                        )}

                        <div className="mt-6 flex justify-center">
                            <UiButton
                                variant="ghost"
                                onClick={() => signOut()}
                                style={{ color: "var(--textMuted)" }}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </UiButton>
                        </div>
                    </div>
                </MuiCard>

                {/* Suspension History Log */}
                <MuiCard
                    className="backdrop-blur"
                    style={{
                        backgroundColor: "color-mix(in oklab, var(--card), transparent 20%)",
                        borderColor: "var(--border)",
                        borderWidth: "1px"
                    }}
                    variant="elevated"
                >
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                            <Clock className="w-5 h-5" />
                            Suspension History
                        </h2>

                        {!history || history.length === 0 ? (
                            <p className="text-sm text-center py-4" style={{ color: "var(--textMuted)" }}>
                                No history available
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {history.map((log, index) => (
                                    <div
                                        key={index}
                                        className="p-3 rounded border-l-4"
                                        style={{
                                            backgroundColor: "var(--muted)",
                                            borderLeftColor: index === 0 ? "var(--danger)" : "var(--border)",
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>
                                                    {log.previousStatus && (
                                                        <>
                                                            <span style={{ color: "var(--textMuted)" }}>{getStatusText(log.previousStatus)}</span>
                                                            {" → "}
                                                        </>
                                                    )}
                                                    <span style={{ color: index === 0 ? "var(--danger)" : "var(--foreground)" }}>
                                                        {getStatusText(log.newStatus)}
                                                    </span>
                                                </p>
                                            </div>
                                            <p className="text-xs" style={{ color: "var(--textMuted)" }}>
                                                {new Date(log.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                                            {log.reason}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </MuiCard>
            </div>
        </div>
    );
}



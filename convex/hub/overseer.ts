import { mutation, query, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { SUSPENSION_STAGES } from "../lib/permissions_utils";

const VOTING_WINDOW_MS = 72 * 60 * 60 * 1000; // 72 hours

// Check if the current user is an overseer
async function mustBeOverseer(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q: any) => q.eq("clerkUserId", identity.subject))
        .unique();

    if (!user || !user.overseer) {
        throw new Error("Restricted: Overseer access required");
    }
    return user;
}

// Get the report feed for overseers (masked PPI, oldest first)
export const getReportFeed = query({
    args: {},
    handler: async (ctx) => {
        const user = await mustBeOverseer(ctx);
        const now = Date.now();

        // Get pending reports
        const reports = await ctx.db
            .query("chatReports")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        // Filter by 72h window and sort by oldest first
        const activeReports = reports
            .filter((r) => now - r.timestamp < VOTING_WINDOW_MS)
            .sort((a, b) => a.timestamp - b.timestamp);

        // Get user's existing votes to show status
        const userVotes = await ctx.db
            .query("overseerVotes")
            .withIndex("by_overseer", (q) => q.eq("overseerId", user._id))
            .collect();

        const votedReports = new Set(userVotes.map((v) => v.reportId));

        // Return masked data
        return Promise.all(activeReports.map(async (r) => {
            let targetUser = null;
            if (r.targetUserId) {
                targetUser = await ctx.db.get(r.targetUserId);
            }
            return {
                _id: r._id,
                reason: r.reason,
                content: r.content,
                timestamp: r.timestamp,
                type: r.messageId ? "message" : r.fileId ? "file" : "user",
                hasVoted: votedReports.has(r._id),
                expiresAt: r.timestamp + VOTING_WINDOW_MS,
                targetUser: targetUser ? {
                    displayName: targetUser.displayName,
                    username: targetUser.username,
                    avatarUrl: targetUser.avatarUrl,
                    coverUrl: targetUser.coverUrl,
                    bio: targetUser.bio,
                } : null,
            };
        }));
    },
});

// Cast a vote on a report
export const castVote = mutation({
    args: {
        reportId: v.id("chatReports"),
        vote: v.union(v.literal("suspend"), v.literal("ban"), v.literal("none"), v.literal("false_report"), v.literal("mod_action")),
        modActions: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const user = await mustBeOverseer(ctx);
        const now = Date.now();

        const report = await ctx.db.get(args.reportId);
        if (!report) throw new Error("Report not found");
        if (report.status !== "pending") throw new Error("Report is already finalized");

        // Check window
        if (now - report.timestamp > VOTING_WINDOW_MS) {
            throw new Error("Voting window has closed");
        }

        // Check if already voted
        const existingVote = await ctx.db
            .query("overseerVotes")
            .withIndex("by_report_and_overseer", (q) =>
                q.eq("reportId", args.reportId).eq("overseerId", user._id)
            )
            .unique();

        if (existingVote) throw new Error("You have already voted on this report");

        // Record vote
        await ctx.db.insert("overseerVotes", {
            reportId: args.reportId,
            overseerId: user._id,
            vote: args.vote as any,
            modActions: args.modActions,
            timestamp: now,
        });

        // Award point
        const currentPoints = user.overseerPoints ?? 0;
        await ctx.db.patch(user._id, {
            overseerPoints: currentPoints + 1,
        });

        return { success: true, points: currentPoints + 1 };
    },
});

// Get overseer stats for the dashboard
export const getOverseerDashboard = query({
    args: {},
    handler: async (ctx) => {
        const user = await mustBeOverseer(ctx);

        const votes = await ctx.db
            .query("overseerVotes")
            .withIndex("by_overseer", (q) => q.eq("overseerId", user._id))
            .collect();

        return {
            points: user.overseerPoints ?? 0,
            totalVotes: votes.length,
            recentVotes: votes.slice(-5).reverse(),
        };
    },
});

// (Integrated in frontend) Check if user is overseer
export const isOverseer = query({
    args: {},
    handler: async (ctx) => {
        try {
            await mustBeOverseer(ctx);
            return true;
        } catch {
            return false;
        }
    },
});

// Resolve all pending reports that have passed their 72h window
export const resolvePendingReports = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const pendingReports = await ctx.db
            .query("chatReports")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        const expiredReports = pendingReports.filter(
            (r) => now - r.timestamp >= VOTING_WINDOW_MS
        );

        let resolvedCount = 0;
        for (const report of expiredReports) {
            await ctx.scheduler.runAfter(0, internal.hub.overseer.resolveReportAction, {
                reportId: report._id,
            });
            resolvedCount++;
        }

        return { resolved: resolvedCount };
    },
});

// Internal action to resolve a specific report
export const resolveReportAction = internalMutation({
    args: { reportId: v.id("chatReports") },
    handler: async (ctx, args) => {
        const now = Date.now();
        const report = await ctx.db.get(args.reportId);
        if (!report || report.status !== "pending") return;

        // Get all votes for this report
        const votes = await ctx.db
            .query("overseerVotes")
            .withIndex("by_report", (q) => q.eq("reportId", report._id))
            .collect();

        if (votes.length === 0) {
            // No votes, just dismiss
            await ctx.db.patch(report._id, {
                status: "dismissed",
                resolutionAction: "none",
                resolutionReason: "Dismissed: No votes recorded during voting window.",
                resolutionTimestamp: now,
            });
            return;
        }

        const totalVotes = votes.length;
        const banVotes = votes.filter((v) => v.vote === "ban").length;
        const suspendVotes = votes.filter((v) => v.vote === "suspend").length;
        const falseReportVotes = votes.filter((v) => v.vote === "false_report").length;
        const modActionVotes = votes.filter((v) => v.vote === "mod_action").length;

        const banPercent = (banVotes / totalVotes) * 100;
        const suspendPercent = ((banVotes + suspendVotes) / totalVotes) * 100;
        const falseReportPercent = (falseReportVotes / totalVotes) * 100;
        const modActionPercent = (modActionVotes / totalVotes) * 100;

        let finalAction: "ban" | "suspend" | "false_report" | "none" | "mod_action" = "none";
        let reason = `Resolved by Overseer voting (${totalVotes} votes). `;
        let appliedModActions: string[] = [];

        if (banPercent > 70) {
            finalAction = "ban";
            reason += `Outcome: Ban (>70% threshold met: ${banPercent.toFixed(1)}%)`;
        } else if (suspendPercent > 50) {
            finalAction = "suspend";
            reason += `Outcome: Suspend (>50% threshold met: ${suspendPercent.toFixed(1)}%)`;
        } else if (modActionPercent > 50) {
            finalAction = "mod_action";
            reason += `Outcome: Profile Enforcement (>50% threshold met: ${modActionPercent.toFixed(1)}%)`;

            // Calculate which specific mod actions had >= 50% majority within the mod_action voters
            const modVoters = votes.filter(v => v.vote === "mod_action");
            const actionCounts: Record<string, number> = {};
            modVoters.forEach(v => {
                v.modActions?.forEach(action => {
                    actionCounts[action] = (actionCounts[action] || 0) + 1;
                });
            });

            appliedModActions = Object.entries(actionCounts)
                .filter(([_, count]) => (count / modVoters.length) * 100 >= 50)
                .map(([action]) => action);

            if (appliedModActions.length > 0) {
                reason += `. Required changes: ${appliedModActions.join(", ")}`;
            } else {
                // Fallback if somehow no specific action hit 50% despite mod_action winning
                // This shouldn't normally happen if voters are consistent, but let's be safe.
                reason += ". No specific profile changes could be agreed upon (>50% consensus for a specific field missing).";
                finalAction = "none";
            }
        } else if (falseReportPercent > 50) {
            finalAction = "false_report";
            reason += `Outcome: Malicious/False Report (>50% threshold met: ${falseReportPercent.toFixed(1)}%)`;
        } else {
            reason += `Outcome: No Action (Thresholds not met)`;
        }

        if (report.targetUserId && (finalAction === "ban" || finalAction === "suspend" || finalAction === "mod_action")) {
            let newStatus: string = SUSPENSION_STAGES.STAGE_1;
            if (finalAction === "ban") {
                newStatus = SUSPENSION_STAGES.ACTIVE;
                await ctx.db.patch(report.targetUserId, {
                    suspensionStatus: newStatus,
                    bannedUntil: now + 30 * 24 * 60 * 60 * 1000, // 30 day ban
                });
            } else if (finalAction === "suspend") {
                newStatus = SUSPENSION_STAGES.STAGE_1;
                await ctx.db.patch(report.targetUserId, {
                    suspensionStatus: newStatus,
                });
            } else if (finalAction === "mod_action") {
                newStatus = SUSPENSION_STAGES.STAGE_PROFILE_UPDATE;
                await ctx.db.patch(report.targetUserId, {
                    suspensionStatus: newStatus,
                    requiredProfileChanges: appliedModActions,
                });
            }

            // Log action in suspensionLogs
            await ctx.db.insert("suspensionLogs", {
                userId: report.targetUserId,
                previousStatus: (report as any).targetUser?.suspensionStatus ?? "active",
                newStatus: newStatus as any,
                reason: reason,
                updatedBy: "system" as any,
                createdAt: now,
            });
        }

        // Apply penalty to reporter if it's a false report
        if (finalAction === "false_report" && report.reporterId) {
            await ctx.db.patch(report.reporterId, {
                suspensionStatus: SUSPENSION_STAGES.STAGE_1,
            });

            // Log action in suspensionLogs for the REPORTER
            await ctx.db.insert("suspensionLogs", {
                userId: report.reporterId,
                previousStatus: "active",
                newStatus: SUSPENSION_STAGES.STAGE_1,
                reason: `Penalty for malicious/false reporting: ${reason}`,
                updatedBy: "system" as any,
                createdAt: now,
            });
        }

        // Update report status
        await ctx.db.patch(report._id, {
            status: finalAction === "none" ? "dismissed" : "resolved",
            resolutionAction: finalAction,
            resolutionReason: reason,
            resolutionTimestamp: now,
            resolutionModActions: appliedModActions,
        });
    },
});

// Get feed of resolved reports the overseer has voted on
export const getResolvedReportFeed = query({
    args: {},
    handler: async (ctx) => {
        const user = await mustBeOverseer(ctx);

        // Get all votes by this overseer
        const votes = await ctx.db
            .query("overseerVotes")
            .withIndex("by_overseer", (q) => q.eq("overseerId", user._id))
            .collect();

        const reportIds = votes.map((v) => v.reportId);

        const resolvedReports = await Promise.all(reportIds.map(async (reportId) => {
            const report = await ctx.db.get(reportId);
            if (report && (report.status === "resolved" || report.status === "dismissed")) {
                const myVote = votes.find((v) => v.reportId === reportId)?.vote;

                let targetUser = null;
                if (report.targetUserId) {
                    targetUser = await ctx.db.get(report.targetUserId);
                }

                return {
                    ...report,
                    type: report.messageId ? "message" : report.fileId ? "file" : "user",
                    expiresAt: report.timestamp + VOTING_WINDOW_MS,
                    myVote,
                    targetUser: targetUser ? {
                        displayName: targetUser.displayName,
                        username: targetUser.username,
                        avatarUrl: targetUser.avatarUrl,
                        coverUrl: targetUser.coverUrl,
                        bio: targetUser.bio,
                    } : null,
                };
            }
            return null;
        }));

        const filteredReports = resolvedReports.filter((r): r is NonNullable<typeof r> => r !== null);

        // Sort by resolution timestamp, most recent first
        return filteredReports.sort((a, b) => (b.resolutionTimestamp ?? 0) - (a.resolutionTimestamp ?? 0));
    },
});

// Report a message
export const reportMessage = mutation({
    args: {
        messageId: v.id("messages"),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const reporter = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
            .unique();

        if (!reporter) throw new Error("Reporter user not found");

        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");

        if (message.senderId?.toString() === reporter._id.toString()) {
            throw new Error("You cannot report your own message");
        }

        const now = Date.now();

        // Insert into chatReports
        await ctx.db.insert("chatReports", {
            messageId: args.messageId,
            reporterId: reporter._id,
            targetUserId: message.senderId,
            reason: args.reason,
            status: "pending",
            content: message.content,
            timestamp: now,
        });

        return { success: true };
    },
});

// Report a user
export const reportUser = mutation({
    args: {
        targetUserId: v.id("users"),
        reason: v.string(),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const reporter = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
            .unique();

        if (!reporter) throw new Error("Reporter user not found");

        if (args.targetUserId.toString() === reporter._id.toString()) {
            throw new Error("You cannot report yourself");
        }

        const now = Date.now();

        // Insert into chatReports
        await ctx.db.insert("chatReports", {
            reporterId: reporter._id,
            targetUserId: args.targetUserId,
            reason: args.reason,
            status: "pending",
            content: args.content,
            timestamp: now,
        });

        return { success: true };
    },
});

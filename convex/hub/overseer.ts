import { mutation, query, internalMutation, MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { SUSPENSION_STAGES } from "../lib/permissions_utils";
import { Doc } from "../_generated/dataModel";
import { ensureOverseer } from "../lib/admin";
import { SYSTEM_USER_ID } from "../seed";

// Get the count of pending reports
export const getPendingReportCount = query({
    args: {},
    handler: async (ctx) => {
        await ensureOverseer(ctx);
        const reports = await ctx.db
            .query("chatReports")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();
        return reports.length;
    },
});

// Get overview stats for the admin dashboard
export const getDashboardStats = query({
    args: {},
    handler: async (ctx) => {
        await ensureOverseer(ctx);
        const users = await ctx.db.query("users").collect();
        const reports = await ctx.db.query("chatReports").collect();
        // Just take a sample of messages for "activity" proxy to avoid huge collect
        const recentMessages = await ctx.db.query("messages").order("desc").take(1000);
        
        const pendingReports = reports.filter(r => r.status === "pending").length;
        const resolvedReports = reports.length - pendingReports;

        // Health: ratio of resolved to total reports, or 100% if no reports
        // If there are many pending reports (> 10), health starts to dip
        const healthBase = reports.length > 0 ? (resolvedReports / reports.length) * 100 : 100;
        const healthPenalty = Math.min(20, pendingReports * 2); // Penalty for many pending reports
        const health = Math.max(0, healthBase - healthPenalty);

        // DB usage: Estimate based on counts
        const totalDocs = users.length + reports.length + 5000; // placeholder for other tables
        const estimatedUsageBytes = totalDocs * 1024; // 1KB per doc on average
        const usageGB = (estimatedUsageBytes / (1024 * 1024 * 1024)).toFixed(2);

        return {
            totalUsers: users.length,
            pendingReports,
            systemHealth: health.toFixed(1) + "%",
            databaseUsage: usageGB + " GB",
        };
    },
});

// Get recent moderation activity for the live feed
export const getAdminActivityFeed = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        await ensureOverseer(ctx);
        const limit = args.limit ?? 10;
        
        // Fetch recent resolved reports using our new by_timestamp index if possible
        // but since we want to filter by status, we might just collect and filter or use status index
        const reports = await ctx.db.query("chatReports")
            .withIndex("by_status")
            .filter(q => q.neq(q.field("status"), "pending"))
            .order("desc")
            .take(limit);

        const feed = await Promise.all(reports.map(async (r) => {
            const target = r.targetUserId ? await ctx.db.get(r.targetUserId) : null;
            return {
                id: r._id,
                type: "resolution",
                action: r.resolutionAction || "dismissed",
                targetUser: target?.username || "System",
                timestamp: r.resolutionTimestamp || r.timestamp,
                description: r.resolutionReason || "No reason provided",
            };
        }));

        return feed;
    },
});

// Get the report feed for overseers (masked PPI, oldest first)
export const getReportFeed = query({
    args: {},
    handler: async (ctx) => {
        const user = await ensureOverseer(ctx);
        const now = Date.now();

        // Get pending reports
        const reports = await ctx.db
            .query("chatReports")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        // Sort by oldest first
        const activeReports = reports
            .sort((a, b) => a.timestamp - b.timestamp);

        // Get user's existing votes to show status
        const userVotes = await ctx.db
            .query("overseerVotes")
            .withIndex("by_overseer", (q) => q.eq("overseerId", user._id))
            .collect();

        const votedReports = new Set(userVotes.map((v) => v.reportId));

        // Return data with reporter and target user details
        return Promise.all(activeReports.map(async (r) => {
            let targetUser = null;
            if (r.targetUserId) {
                targetUser = await ctx.db.get(r.targetUserId);
            }
            
            const allReporterIds = [...new Set([r.reporterId, ...(r.reporterIds || [])])];
            const reporters = await Promise.all(allReporterIds.map(async (id) => {
                const user = await ctx.db.get(id);
                if (!user) return null;
                const scoreDoc = await ctx.db.query("socialScores").withIndex("by_user", q => q.eq("userId", user._id)).first();
                return {
                    _id: user._id,
                    username: user.username,
                    displayName: user.displayName,
                    socialScore: scoreDoc?.score ?? 10000,
                };
            }));
            const filteredReporters = reporters.filter((rep): rep is NonNullable<typeof rep> => rep !== null);

            let targetScoreDoc = null;
            if (targetUser) {
                targetScoreDoc = await ctx.db.query("socialScores").withIndex("by_user", q => q.eq("userId", targetUser._id)).first();
            }

            return {
                _id: r._id,
                reason: r.reason,
                content: r.content,
                timestamp: r.timestamp,
                type: r.messageId ? "message" : r.fileId ? "file" : "user",
                hasVoted: votedReports.has(r._id),
                expiresAt: r.timestamp, // No longer expires
                reporters: filteredReporters,
                reporter: filteredReporters[0] || null, // For backward compatibility
                targetUser: targetUser ? {
                    _id: targetUser._id,
                    displayName: targetUser.displayName,
                    username: targetUser.username,
                    avatarUrl: targetUser.avatarUrl,
                    coverUrl: targetUser.coverUrl,
                    bio: targetUser.bio,
                    socialScore: targetScoreDoc?.score ?? 10000,
                } : null,
            };
        }));
    },
});

/**
 * Internal helper to apply a moderation resolution to a report.
 */
async function applyResolution(
    ctx: MutationCtx,
    user: Doc<"users">,
    args: {
        reportId: Id<"chatReports">,
        action: "none" | "warn" | "suspend" | "ban" | "false_report" | "false_report_no_penalty" | "mod_action",
        reason?: string,
        modActions?: string[]
    }
) {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found");
    if (report.status !== "pending") return; // Already resolved

    const now = Date.now();
    const resolutionReason = args.reason || `Processed by the Overseer team.`;

    if (report.targetUserId && (args.action === "ban" || args.action === "suspend" || args.action === "warn" || args.action === "mod_action")) {
        let newStatus: string = SUSPENSION_STAGES.STAGE_1;
        let bannedUntil = undefined;
        let notificationMessage = "";

        if (args.action === "ban") {
            newStatus = SUSPENSION_STAGES.ACTIVE;
            bannedUntil = now + (365 * 100 * 24 * 60 * 60 * 1000); // 100 year ban
            notificationMessage = `You have received a formal warning from the Overseer Registry.\nWhat was reported: A message was reported\nContents of message: ${report.content}\nReason for action: ${resolutionReason}\n\nPlease review our community guidelines to avoid further sanctions.\n\nYour account has been permanently banned.`;
        } else if (args.action === "suspend") {
            newStatus = SUSPENSION_STAGES.ACTIVE;
            bannedUntil = now + (7 * 24 * 60 * 60 * 1000); // 7 day suspension
            notificationMessage = `You have received a formal warning from the Overseer Registry.\nWhat was reported: A message was reported\nContents of message: ${report.content}\nReason for action: ${resolutionReason}\n\nPlease review our community guidelines to avoid further sanctions.\n\nYour account has been suspended for 7 days.`;
        } else if (args.action === "warn") {
            newStatus = SUSPENSION_STAGES.STAGE_1;
            notificationMessage = `You have received a formal warning from the Overseer Registry.\nWhat was reported: A message was reported\nContents of message: ${report.content}\nReason for action: ${resolutionReason}\n\nPlease review our community guidelines to avoid further sanctions.`;
        } else if (args.action === "mod_action") {
            newStatus = SUSPENSION_STAGES.STAGE_PROFILE_UPDATE;
            notificationMessage = `You have received a formal warning from the Overseer Registry.\nWhat was reported: A message was reported\nContents of message: ${report.content}\nReason for action: ${resolutionReason}\n\nPlease review our community guidelines to avoid further sanctions.\n\nAdministrative action required: Your profile has been flagged for manual update.`;
        }

        const targetUser = await ctx.db.get(report.targetUserId);

        await ctx.db.patch(report.targetUserId, {
            suspensionStatus: newStatus as any,
            ...(bannedUntil !== undefined ? { bannedUntil } : {}),
            ...(args.action === "mod_action" ? { requiredProfileChanges: args.modActions } : {}),
        });

        // Integrate with social score system
        const actionToType: Record<string, string> = {
            "ban": "ban",
            "suspend": "suspend",
            "warn": "warn",
            "mod_action": "mute"
        };
        const punishmentTypeName = actionToType[args.action] || "mute";
        const punishmentType = await ctx.db.query("punishmentTypes").withIndex("by_name", (q: any) => q.eq("name", punishmentTypeName)).first();
        
        let punishmentId = undefined;
        if (punishmentType) {
            punishmentId = await ctx.db.insert("userPunishments", {
                userId: report.targetUserId,
                punishmentTypeId: punishmentType._id,
                targetUserId: report.targetUserId,
                appliedAt: now,
                active: true,
                affectSocialScore: true,
                appliedById: user._id,
                endAt: bannedUntil,
            });
            
            await ctx.runMutation(internal.community.punishments.updateUserSocialScoreMutation, { userId: report.targetUserId });
        }

        // Log action in suspensionLogs
        await ctx.db.insert("suspensionLogs", {
            userId: report.targetUserId,
            previousStatus: (targetUser as any)?.suspensionStatus || "active",
            newStatus: newStatus as any,
            reason: resolutionReason,
            updatedBy: user._id,
            createdAt: now,
            metadata: punishmentId ? { punishmentId } : undefined,
        });

        // Send System DM
        if (notificationMessage) {
            await sendSystemDM(ctx, report.targetUserId, notificationMessage);
        }
    }

    // Notify reporters
    if (args.action !== "none") {
        const allReporters = new Set([report.reporterId, ...(report.reporterIds || [])]);

        for (const rId of allReporters) {
            // Apply penalty to reporter if it's a penalized false report
            if (args.action === "false_report") {
                const reporter = await ctx.db.get(rId);
                if (reporter) {
                    await ctx.db.insert("suspensionLogs", {
                        userId: rId,
                        previousStatus: (reporter as any)?.suspensionStatus || "active",
                        newStatus: (reporter as any)?.suspensionStatus || "active",
                        reason: `Penalty for false report: ${resolutionReason}`,
                        updatedBy: user._id,
                        createdAt: now,
                    });
                    
                    const punishmentType = await ctx.db.query("punishmentTypes").withIndex("by_name", (q: any) => q.eq("name", "mute")).first();
                    if (punishmentType) {
                        await ctx.db.insert("userPunishments", {
                            userId: rId,
                            punishmentTypeId: punishmentType._id,
                            appliedById: user._id,
                            active: true,
                            appliedAt: now,
                        });
                    }

                    // Update social score for false reporting
                    await ctx.runMutation(internal.community.punishments.updateUserSocialScoreMutation, { userId: rId });
                }
            }

            // Always notify reporters for false_report variants and other actions
            const formattedDate = new Date(report.timestamp).toLocaleDateString();
            let reporterMessage = "";

            if (args.action === "false_report" || args.action === "false_report_no_penalty") {
                reporterMessage = `Your report from ${formattedDate} has been reviewed and deemed a false report.`;
            } else {
                // Determine action label
                const labelMap: Record<string, string> = {
                    "warn": "Warning issued",
                    "suspend": "Account Suspended",
                    "ban": "Permanent Ban",
                    "mod_action": "Profile Update Required"
                };
                const actionLabel = labelMap[args.action] || args.action;
                reporterMessage = `The message reported on ${formattedDate} has been reviewed and action has been taken. Action taken: ${actionLabel}. Thank you.`;
            }
            
            await sendSystemDM(ctx, rId, reporterMessage);
        }
    } else {
        const allReporters = new Set([report.reporterId, ...(report.reporterIds || [])]);
        const formattedDate = new Date(report.timestamp).toLocaleDateString();
        const reporterMessage = `Your report from ${formattedDate} has been reviewed. Outcome: No further action taken at this time.`;
        
        for (const rId of allReporters) {
            await sendSystemDM(ctx, rId, reporterMessage);
        }
    }

    // Resolve report status
    await ctx.db.patch(args.reportId, {
        status: "resolved",
        resolutionTimestamp: now,
        resolutionAction: args.action,
        resolutionReason,
    });
}

/**
 * Send a DM from the System user to a target user.
 */
async function sendSystemDM(ctx: MutationCtx, targetUserId: Id<"users">, content: string) {
    const systemUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", SYSTEM_USER_ID))
        .unique();

    if (!systemUser) {
        console.error("System user not found. DM not sent.");
        return;
    }

    // Find DM chat
    const chats = await ctx.db
        .query("chats")
        .withIndex("by_isGroup", (q) => q.eq("isGroup", false))
        .collect();
    
    let chat = chats.find(c => 
        c.participants.length === 2 && 
        c.participants.includes(systemUser._id) && 
        c.participants.includes(targetUserId)
    );

    let chatId: Id<"chats">;
    if (!chat) {
        chatId = await ctx.db.insert("chats", {
            participants: [systemUser._id, targetUserId],
            isGroup: false,
            createdBy: systemUser._id,
            status: "active",
            createdAt: Date.now(),
            lastActivityAt: Date.now(),
        });
    } else {
        chatId = chat._id;
        await ctx.db.patch(chatId, { lastActivityAt: Date.now() });
    }

    // Send message
    await ctx.db.insert("messages", {
        chatId,
        content,
        senderId: systemUser._id,
        sentAt: Date.now(),
        isEdited: false,
        isDeleted: false,
    });
}


// Cast a vote on a report - NOW IMMEDIATE RESOLUTION
export const castVote = mutation({
    args: {
        reportId: v.id("chatReports"),
        vote: v.union(v.literal("warn"), v.literal("suspend"), v.literal("ban"), v.literal("none"), v.literal("false_report"), v.literal("false_report_no_penalty"), v.literal("mod_action")),
        reason: v.optional(v.string()),
        modActions: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const user = await ensureOverseer(ctx);
        const now = Date.now();

        const report = await ctx.db.get(args.reportId);
        if (!report) throw new Error("Report not found");
        if (report.status !== "pending") throw new Error(`Report is already ${report.status}`);

        // Record the action in overseerVotes for history/points
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

        // IMMEDIATELY APPLY RESOLUTION
        await applyResolution(ctx, user, {
            reportId: args.reportId,
            action: args.vote,
            reason: args.reason,
            modActions: args.modActions,
        });
    },
});

// Admin ONLY: Directly resolve a report
export const resolveReportDirectly = mutation({
    args: {
        reportId: v.id("chatReports"),
        action: v.union(v.literal("none"), v.literal("warn"), v.literal("suspend"), v.literal("ban"), v.literal("false_report"), v.literal("false_report_no_penalty"), v.literal("mod_action")),
        reason: v.optional(v.string()),
        modActions: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const user = await ensureOverseer(ctx);
        await applyResolution(ctx, user, {
            ...args,
            reason: args.reason,
        });
        return { success: true };
    },
});

// Get overseer stats for the dashboard
export const getOverseerDashboard = query({
    args: {},
    handler: async (ctx) => {
        const user = await ensureOverseer(ctx);

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
            await ensureOverseer(ctx);
            return true;
        } catch {
            return false;
        }
    },
});


// Get feed of resolved reports the overseer has voted on
export const getResolvedReportFeed = query({
    args: {},
    handler: async (ctx) => {
        const user = await ensureOverseer(ctx);

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

                const allReporterIds = [...new Set([report.reporterId, ...(report.reporterIds || [])])];
                const reporters = await Promise.all(allReporterIds.map(async (id) => {
                    const user = await ctx.db.get(id);
                    if (!user) return null;
                    const scoreDoc = await ctx.db.query("socialScores").withIndex("by_user", q => q.eq("userId", user._id)).first();
                    return {
                        _id: user._id,
                        username: user.username,
                        displayName: user.displayName,
                        socialScore: scoreDoc?.score ?? 10000,
                    };
                }));
                const filteredReporters = reporters.filter((rep): rep is NonNullable<typeof rep> => rep !== null);
                
                let targetUser = null;
                if (report.targetUserId) {
                    targetUser = await ctx.db.get(report.targetUserId);
                }
                const targetScoreDoc = targetUser ? await ctx.db.query("socialScores").withIndex("by_user", q => q.eq("userId", targetUser._id)).first() : null;

                return {
                    ...report,
                    type: report.messageId ? "message" : report.fileId ? "file" : "user",
                    expiresAt: report.timestamp,
                    myVote,
                    reporters: filteredReporters,
                    reporter: filteredReporters[0] || null, // For backward compatibility
                    targetUser: targetUser ? {
                        _id: targetUser._id,
                        displayName: targetUser.displayName,
                        username: targetUser.username,
                        avatarUrl: targetUser.avatarUrl,
                        coverUrl: targetUser.coverUrl,
                        bio: targetUser.bio,
                        socialScore: targetScoreDoc?.score ?? 10000,
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

        if (!message.senderId) {
            throw new Error("System messages cannot be reported");
        }

        const sender = await ctx.db.get(message.senderId);
        if (sender?.role === "system") {
            throw new Error("System messages cannot be reported");
        }

        if (message.senderId.toString() === reporter._id.toString()) {
            throw new Error("You cannot report your own message");
        }

        const now = Date.now();

        // Check if this message has already been reported
        const existingReport = await ctx.db
            .query("chatReports")
            .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
            .first();

        if (existingReport) {
            // If it's already resolved, we don't need to do anything
            if (existingReport.status === "resolved") {
                return { success: true, alreadyReported: true };
            }

            // If it's pending, add this reporter to the list if they aren't already there
            const allReporters = new Set([existingReport.reporterId, ...(existingReport.reporterIds || [])]);
            if (!allReporters.has(reporter._id)) {
                const currentReporterIds = existingReport.reporterIds || [];
                await ctx.db.patch(existingReport._id, {
                    reporterIds: [...currentReporterIds, reporter._id],
                });
            }
            return { success: true, alreadyReported: true };
        }

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

        // Check if this user has a pending report
        const existingReport = await ctx.db
            .query("chatReports")
            .withIndex("by_target_user", (q) => q.eq("targetUserId", args.targetUserId))
            .filter((q) => q.and(q.eq(q.field("status"), "pending"), q.eq(q.field("messageId"), undefined)))
            .first();

        if (existingReport) {
            const allReporters = new Set([existingReport.reporterId, ...(existingReport.reporterIds || [])]);
            if (!allReporters.has(reporter._id)) {
                const currentReporterIds = existingReport.reporterIds || [];
                await ctx.db.patch(existingReport._id, {
                    reporterIds: [...currentReporterIds, reporter._id],
                });
            }
            return { success: true, alreadyReported: true };
        }

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

/**
 * Get detailed logs for a specific user.
 */
export const getUserLogs = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        await ensureOverseer(ctx);

        const logs = await ctx.db
            .query("suspensionLogs")
            .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
            .order("desc")
            .collect();

        const labelMap: Record<string, string> = {
            "suspensionStage1": "Stage 1 Warning",
            "suspensionStageActive": "Full Suspension",
            "suspensionStageFalse": "False Report Cleared",
            "suspensionStageAppeal": "Appeal Process Started",
            "suspensionStageAppealDenied": "Appeal Denied",
            "suspensionStageAppealWon": "Appeal Approved/Won",
            "suspensionStageProfileUpdate": "Metadata/Profile Flagged",
            "promoted_to_admin": "Overseer Privileges Granted",
            "demoted_from_admin": "Overseer Privileges Revoked",
            "none": "Report Dismissed"
        };

        return Promise.all(logs.map(async (log) => {
            const admin = log.updatedBy ? await ctx.db.get(log.updatedBy) : null;
            return {
                _id: log._id,
                action: labelMap[log.newStatus] || log.newStatus,
                reason: log.reason,
                adminName: admin?.username || "System",
                timestamp: log.createdAt,
            };
        }));
    },
});

/**
 * Directly warn a user from the admin registry.
 */
export const warnUser = mutation({
    args: {
        userId: v.id("users"),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        const adminUser = await ensureOverseer(ctx);
        const now = Date.now();
        const targetUser = await ctx.db.get(args.userId);
        if (!targetUser) throw new Error("User not found");

        const newStatus = SUSPENSION_STAGES.STAGE_1;
        const resolutionReason = args.reason || `Resolved by Overseer ${adminUser.username}.`;

        // Update user status
        await ctx.db.patch(args.userId, {
            suspensionStatus: newStatus as any,
        });

        // Insert punishment record
        const punishmentType = await ctx.db.query("punishmentTypes").withIndex("by_name", (q: any) => q.eq("name", "warn")).first();
        let punishmentId = undefined;
        if (punishmentType) {
            punishmentId = await ctx.db.insert("userPunishments", {
                userId: args.userId,
                punishmentTypeId: punishmentType._id,
                targetUserId: args.userId,
                appliedAt: now,
                active: true,
                affectSocialScore: true,
                appliedById: adminUser._id,
            });
            await ctx.runMutation(internal.community.punishments.updateUserSocialScoreMutation, { userId: args.userId });
        }

        // Log action
        await ctx.db.insert("suspensionLogs", {
            userId: args.userId,
            previousStatus: targetUser.suspensionStatus || "active",
            newStatus: newStatus as any,
            reason: resolutionReason,
            updatedBy: adminUser._id,
            createdAt: now,
            metadata: punishmentId ? { punishmentId } : undefined,
        });

        // Send System DM
        const notificationMessage = `You have received a formal warning from the Overseer Registry.\nReason: ${resolutionReason}\n\nPlease review our community guidelines to avoid further sanctions.`;
        await sendSystemDM(ctx, args.userId, notificationMessage);

        return { success: true };
    },
});

/**
 * List all users with basic moderation info.
 */
export const listUsers = query({
    args: {
        searchQuery: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await ensureOverseer(ctx);
        const limit = args.limit ?? 50;

        let users;
        if (args.searchQuery) {
            users = await ctx.db
                .query("users")
                .withSearchIndex("search_username", (q: any) => q.search("username", args.searchQuery!))
                .take(limit);
        } else {
            users = await ctx.db.query("users").order("desc").take(limit);
        }

        return Promise.all(users.map(async (u) => {
            const socialScore = await ctx.db.query("socialScores")
                .withIndex("by_user", (q: any) => q.eq("userId", u._id))
                .unique();

            return {
                _id: u._id,
                username: u.username,
                displayName: u.displayName,
                avatarUrl: u.avatarUrl,
                overseeradmin: u.overseeradmin,
                isBanned: (u.bannedUntil ?? 0) > Date.now(),
                suspensionStatus: u.suspensionStatus,
                socialScore: socialScore?.score ?? 10000,
            };
        }));
    },
});

/**
 * Reverse a moderation action.
 */
export const reverseAction = mutation({
    args: { logId: v.id("suspensionLogs") },
    handler: async (ctx, args) => {
        const adminUser = await ensureOverseer(ctx);
        const log = await ctx.db.get(args.logId);
        if (!log) throw new Error("Log not found");

        const targetUser = await ctx.db.get(log.userId);
        if (!targetUser) throw new Error("User not found");

        // Revert status
        await ctx.db.patch(log.userId, {
            suspensionStatus: log.previousStatus as any || "active",
            bannedUntil: undefined, // Clear any ban time
        });

        // Revert punishment if it exists
        const punishmentId = log.metadata?.punishmentId;
        if (punishmentId) {
            const punishment = await ctx.db.get(punishmentId);
            if (punishment) {
                await ctx.db.patch(punishmentId, {
                    active: false,
                    affectSocialScore: false,
                });
            }
        } else {
            // Fallback: search for punishment by matching details
            const punishments = await ctx.db
                .query("userPunishments")
                .withIndex("by_user", (q) => q.eq("userId", log.userId))
                .filter((q) => 
                    q.and(
                        q.eq(q.field("appliedAt"), log.createdAt),
                        q.eq(q.field("active"), true)
                    )
                )
                .collect();
            
            for (const p of punishments) {
                await ctx.db.patch(p._id, { active: false, affectSocialScore: false });
            }
        }

        // Trigger social score update
        await ctx.runMutation(internal.community.punishments.updateUserSocialScoreMutation, { userId: log.userId });

        // Log the reversal itself
        await ctx.db.insert("suspensionLogs", {
            userId: log.userId,
            previousStatus: log.newStatus,
            newStatus: log.previousStatus || "active",
            reason: `Reversed by ${adminUser.username}. Original reason: ${log.reason}`,
            updatedBy: adminUser._id,
            createdAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Get all pending appeals.
 */
export const getPendingAppeals = query({
    args: {},
    handler: async (ctx) => {
        await ensureOverseer(ctx);
        const appeals = await ctx.db
            .query("appeals")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .order("desc")
            .collect();

        const labelMap: Record<string, string> = {
            "suspensionStage1": "Stage 1 Warning",
            "suspensionStageActive": "Full Suspension",
            "suspensionStageProfileUpdate": "Metadata/Profile Flagged",
        };

        return Promise.all(appeals.map(async (appeal) => {
            const user = await ctx.db.get(appeal.userId);
            const log = await ctx.db.get(appeal.logId);
            return {
                ...appeal,
                username: user?.username || "Unknown",
                displayName: user?.displayName,
                avatarUrl: user?.avatarUrl,
                originalAction: labelMap[log?.newStatus ?? ""] || log?.newStatus || "Unknown",
                originalReason: log?.reason || "No reason provided",
            };
        }));
    },
});

/**
 * Resolve a user appeal.
 */
export const resolveAppeal = mutation({
    args: {
        appealId: v.id("appeals"),
        decision: v.union(v.literal("approved"), v.literal("denied")),
        adminNote: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const adminUser = await ensureOverseer(ctx);
        const appeal = await ctx.db.get(args.appealId);
        if (!appeal) throw new Error("Appeal not found");
        if (appeal.status !== "pending") throw new Error("Appeal already resolved");

        const now = Date.now();

        if (args.decision === "approved") {
            const log = await ctx.db.get(appeal.logId);
            if (log) {
                // Revert status
                await ctx.db.patch(log.userId, {
                    suspensionStatus: log.previousStatus as any || "active",
                    bannedUntil: undefined,
                });

                // Revert punishment
                const punishmentId = log.metadata?.punishmentId;
                if (punishmentId) {
                    const punishment = await ctx.db.get(punishmentId);
                    if (punishment) {
                        await ctx.db.patch(punishmentId, { active: false, affectSocialScore: false });
                    }
                } else {
                    // Fallback
                    const punishments = await ctx.db
                        .query("userPunishments")
                        .withIndex("by_user", (q) => q.eq("userId", log.userId))
                        .filter((q) => q.and(q.eq(q.field("appliedAt"), log.createdAt), q.eq(q.field("active"), true)))
                        .collect();
                    for (const p of punishments) {
                        await ctx.db.patch(p._id, { active: false, affectSocialScore: false });
                    }
                }

                await ctx.runMutation(internal.community.punishments.updateUserSocialScoreMutation, { userId: log.userId });

                // Log the approval
                await ctx.db.insert("suspensionLogs", {
                    userId: log.userId,
                    previousStatus: log.newStatus,
                    newStatus: log.previousStatus || "active",
                    reason: `Appeal Approved: ${args.adminNote || 'No notes provided'}. Reversed by ${adminUser.username}`,
                    updatedBy: adminUser._id,
                    createdAt: now,
                });
                
                // Notify user via System DM
                await sendSystemDM(ctx, log.userId, `Your appeal has been APPROVED.\nNotes: ${args.adminNote || 'Your suspension/warning has been lifted.'}`);
            }
        } else {
            // Denied
            const log = await ctx.db.get(appeal.logId);
            if (log) {
                await ctx.db.insert("suspensionLogs", {
                    userId: appeal.userId,
                    previousStatus: "suspensionStageAppeal",
                    newStatus: "suspensionStageAppealDenied",
                    reason: `Appeal Denied: ${args.adminNote || 'No further action taken.'}`,
                    updatedBy: adminUser._id,
                    createdAt: now,
                });
                
                // Notify user
                await sendSystemDM(ctx, appeal.userId, `Your appeal has been DENIED.\nNotes: ${args.adminNote || 'The original moderation action stands.'}`);
            }
        }

        // Update appeal record
        await ctx.db.patch(args.appealId, {
            status: args.decision,
            adminId: adminUser._id,
            adminNote: args.adminNote,
            resolvedAt: now,
        });

        return { success: true };
    },
});

/**
 * Sync a user's suspension status based on active punishments.
 */
export const syncUserStatus = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        await ensureOverseer(ctx);
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const activePunishments = await ctx.db
            .query("userPunishments")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("active"), true))
            .collect();

        if (activePunishments.length === 0) {
            await ctx.db.patch(args.userId, {
                suspensionStatus: "active" as any,
                bannedUntil: undefined,
            });
            return { status: "active", message: "User status synced to active (no punishments found)." };
        }

        // Keep existing status if punishments found
        return { status: user.suspensionStatus, message: "User has active punishments. Status preserved." };
    },
});

/**
 * Force reset a user's moderation state (Debug only).
 */
export const debugResetModerationState = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        await ensureOverseer(ctx);
        
        // Deactivate all punishments
        const punishments = await ctx.db
            .query("userPunishments")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
        
        for (const p of punishments) {
            await ctx.db.patch(p._id, { active: false, affectSocialScore: false });
        }

        // Reset user status
        await ctx.db.patch(args.userId, {
            suspensionStatus: "active" as any,
            bannedUntil: undefined,
            requiredProfileChanges: undefined,
        });

        // Sync social score
        await ctx.runMutation(internal.community.punishments.updateUserSocialScoreMutation, { userId: args.userId });

        return { success: true };
    },
});

export const getUserHistory = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        await ensureOverseer(ctx);

        // Fetch suspension logs
        const suspensionLogsRaw = await ctx.db
            .query("suspensionLogs")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        // Fetch user's reports that are NOT pending
        const userReportsRaw = await ctx.db
            .query("chatReports")
            .withIndex("by_target_user", (q) => q.eq("targetUserId", args.userId))
            .collect();

        const resolvedReports = userReportsRaw.filter(r => r.status && r.status !== "pending");

        const history: any[] = [];

        // Format Logs
        for (const log of suspensionLogsRaw) {
            let adminName = "System";
            if (log.updatedBy) {
                const admin = await ctx.db.get(log.updatedBy);
                if (admin) adminName = admin.displayName || admin.username || "Unknown";
            }
            history.push({
                type: "action",
                timestamp: log.createdAt,
                title: log.newStatus !== "active" ? `Status changed to ${log.newStatus}` : "Restored to active",
                reason: log.reason,
                moderator: adminName,
            });
        }

        // Format Reports
        for (const rep of resolvedReports) {
            history.push({
                type: "report",
                timestamp: rep.resolutionTimestamp || rep.timestamp,
                title: `Report ${rep.resolutionAction === "none" ? "Dismissed" : "Resolved"} on ${rep.messageId ? "Message" : rep.fileId ? "File" : "Profile"}`,
                reason: rep.resolutionReason || rep.reason || "No reason specified",
                moderator: rep.resolutionAction || "N/A"
            });
        }

        return history.sort((a, b) => b.timestamp - a.timestamp); // Newest first
    }
});

import { Doc } from "../_generated/dataModel";

export const SUSPENSION_STAGES = {
    STAGE_1: 'suspensionStage1',
    ACTIVE: 'suspensionStageActive',
    FALSE: 'suspensionStageFalse',
    APPEAL: 'suspensionStageAppeal',
    APPEAL_DENIED: 'suspensionStageAppealDenied',
    APPEAL_WON: 'suspensionStageAppealWon',
    STAGE_PROFILE_UPDATE: 'suspensionStageProfileUpdate',
} as const;

export type SuspensionStage = typeof SUSPENSION_STAGES[keyof typeof SUSPENSION_STAGES];

/**
 * Determines if a user is in a blocked state based on their suspension status.
 * 
 * Blocked stages:
 * - STAGE_1 (Pre-suspension/Light)
 * - ACTIVE (Full suspension)
 * - APPEAL (In appeal process)
 * - APPEAL_DENIED (Appeal failed)
 * 
 * Allowed stages:
 * - FALSE (Suspension removed/invalid)
 * - APPEAL_WON (Appeal successful)
 * - undefined/null (Normal user)
 */
export function isUserBlocked(user: Doc<"users">): boolean {
    const status = user.suspensionStatus;

    if (!status) return false;

    const blockedStatuses: string[] = [
        SUSPENSION_STAGES.STAGE_1,
        SUSPENSION_STAGES.ACTIVE,
        SUSPENSION_STAGES.APPEAL,
        SUSPENSION_STAGES.APPEAL_DENIED,
        SUSPENSION_STAGES.STAGE_PROFILE_UPDATE,
    ];

    return blockedStatuses.includes(status);
}

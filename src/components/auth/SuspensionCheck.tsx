"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { BannedScreen } from "./BannedScreen";
import { ReactNode } from "react";

interface SuspensionCheckProps {
    children: ReactNode;
}

export function SuspensionCheck({ children }: SuspensionCheckProps) {
    // Use the public query that is NOT blocked
    const status = useQuery(api.users.suspensionFunctions.getMyStatus);

    // If loading or not authenticated (status undefined/null), we can let the children handle it 
    // (Home page has AuthLoading/Unauthenticated wrappers already), 
    // OR we can just return children and let the inner queries fail/load.
    // Ideally, we wait for status to be known.

    if (status === undefined) {
        return null; // Or a spinner/loading state, but Home already has AuthLoading
    }

    if (status && status.isBlocked) {
        return (
            <BannedScreen
                status={status.status!}
                reason={status.reason}
                bannedUntil={status.bannedUntil}
            />
        );
    }

    return <>{children}</>;
}



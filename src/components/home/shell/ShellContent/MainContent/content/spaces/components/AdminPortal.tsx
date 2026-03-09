import React from 'react';
import { Doc } from "convex/_generated/dataModel";
import SpacePortal from './SpacePortal';

interface AdminPortalProps {
    space: Doc<"spaces">;
    userRole?: string;
}

export default function AdminPortal({ space, userRole }: AdminPortalProps) {
    return <SpacePortal space={space} role="admin" userRole={userRole} />;
}

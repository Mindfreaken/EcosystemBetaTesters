import React from 'react';
import { Doc } from "convex/_generated/dataModel";
import SpacePortal from './SpacePortal';

interface ModeratorPortalProps {
    space: Doc<"spaces">;
    userRole?: string;
}

export default function ModeratorPortal({ space, userRole }: ModeratorPortalProps) {
    return <SpacePortal space={space} role="moderator" userRole={userRole} />;
}



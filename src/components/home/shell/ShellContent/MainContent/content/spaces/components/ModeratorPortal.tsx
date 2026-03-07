import React from 'react';
import { Doc } from "convex/_generated/dataModel";
import SpacePortal from './SpacePortal';

interface ModeratorPortalProps {
    space: Doc<"spaces">;
}

export default function ModeratorPortal({ space }: ModeratorPortalProps) {
    return <SpacePortal space={space} role="moderator" />;
}

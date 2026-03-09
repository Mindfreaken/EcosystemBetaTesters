import React from 'react';
import { Doc } from "convex/_generated/dataModel";
import SpacePortal from './SpacePortal';

interface OwnerPortalProps {
    space: Doc<"spaces">;
    userRole?: string;
}

export default function OwnerPortal({ space, userRole }: OwnerPortalProps) {
    return <SpacePortal space={space} role="owner" userRole={userRole} />;
}

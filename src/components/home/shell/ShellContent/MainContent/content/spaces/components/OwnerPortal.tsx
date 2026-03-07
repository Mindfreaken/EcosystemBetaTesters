import React from 'react';
import { Doc } from "convex/_generated/dataModel";
import SpacePortal from './SpacePortal';

interface OwnerPortalProps {
    space: Doc<"spaces">;
}

export default function OwnerPortal({ space }: OwnerPortalProps) {
    return <SpacePortal space={space} role="owner" />;
}

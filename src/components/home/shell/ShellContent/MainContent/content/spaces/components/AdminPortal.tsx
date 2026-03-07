import React from 'react';
import { Doc } from "convex/_generated/dataModel";
import SpacePortal from './SpacePortal';

interface AdminPortalProps {
    space: Doc<"spaces">;
}

export default function AdminPortal({ space }: AdminPortalProps) {
    return <SpacePortal space={space} role="admin" />;
}

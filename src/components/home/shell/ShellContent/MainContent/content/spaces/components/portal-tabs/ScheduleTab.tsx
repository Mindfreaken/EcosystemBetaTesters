"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { themeVar } from "@/theme/registry";
import { Doc } from "convex/_generated/dataModel";
import ScheduleManager from "../ScheduleManager";

interface ScheduleTabProps {
    space: Doc<"spaces">;
    role: "owner" | "admin" | "moderator";
}

export default function ScheduleTab({ space, role }: ScheduleTabProps) {
    const canManage = role === "owner" || role === "admin" || role === "moderator";

    return (
        <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("textSecondary"), mb: 2 }}>
                EVENT SCHEDULE
            </Typography>
            <ScheduleManager spaceId={space._id} />
        </Box>
    );
}

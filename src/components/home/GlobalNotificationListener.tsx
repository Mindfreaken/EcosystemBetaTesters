"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { BellRing, ShieldAlert } from "lucide-react";

export function GlobalNotificationListener() {
  const { toast } = useToast();
  const activities = useQuery(api.users.activities.queries.getRecentActivities, { limit: 5 });
  
  // Track the most recent timestamp we have alerted for so we don't spam on reload
  const latestTimestampRef = useRef<number>(Date.now());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (activities === undefined || activities === null) return; // Still loading or no user

    // If this is the initial load, just set the high-water mark to the highest timestamp
    // so we don't retroactively alert for old notifications.
    if (!isInitialized) {
      if (activities.length > 0) {
        latestTimestampRef.current = Math.max(...activities.map((a: any) => a.timestamp));
      }
      setIsInitialized(true);
      return;
    }

    // Filter to finding genuinely new activities
    const newActivities = activities.filter((a: any) => a.timestamp > latestTimestampRef.current);

    if (newActivities.length > 0) {
      // Update high-water mark
      latestTimestampRef.current = Math.max(...newActivities.map((a: any) => a.timestamp));

      // Fire a toast for each new activity
      newActivities.forEach((activity: any) => {
        const isAlert = activity.type === "system_alert";
        
        toast({
          title: activity.title || "New Notification",
          description: activity.description || "You have a new activity.",
          duration: 10000,
        });
      });
    }
  }, [activities, isInitialized, toast]);

  return null; // This is a logic-only component that mounts in the background
}

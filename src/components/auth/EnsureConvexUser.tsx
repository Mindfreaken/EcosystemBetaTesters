"use client";

import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function EnsureConvexUser() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const convex = useConvex();
  const ranRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      if (ranRef.current) return;
      if (!isAuthLoaded || !isUserLoaded || !isSignedIn) return;
      try {
        const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || "";
        const username = user?.username || undefined;
        const displayNameMeta = (user?.publicMetadata as any)?.displayName as string | undefined;
        const displayName = (displayNameMeta && displayNameMeta.trim().length > 0)
          ? displayNameMeta
          : username || email.split("@")[0] || "User";
        const dobMeta = (user?.publicMetadata as any)?.dateOfBirth as string | number | undefined;
        let dateOfBirth: number | undefined = undefined;
        if (typeof dobMeta === "number") {
          dateOfBirth = dobMeta;
        } else if (typeof dobMeta === "string" && dobMeta) {
          const t = Date.parse(dobMeta);
          if (!Number.isNaN(t)) dateOfBirth = t;
        }
        // Always call to ensure user exists/links in Convex. Server normalizes DOB and allows creation.
        await convex.mutation(api.users.onboarding.onboarding.ensureUser, {
          email,
          displayName,
          username,
          dateOfBirth,
        });
        ranRef.current = true;
      } catch (e) {
        // Swallow errors to avoid blocking app rendering; server guards for duplicates
        console.error("EnsureConvexUser failed:", e);
        ranRef.current = true; // prevent tight loops
      }
    };
    void run();
  }, [isAuthLoaded, isUserLoaded, isSignedIn, user, convex]);

  return null;
}


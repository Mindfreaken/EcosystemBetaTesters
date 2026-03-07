"use client";

import React from "react";
import ConvexClientProvider from '@/components/ConvexClientProvider'
import { getConvexClient } from "@/lib/convex";
import { ThemeProvider } from "@/components/home/shell/ShellContent/MainContent/content/theme/content/ThemeProvider";
import EnsureConvexUser from "@/components/auth/EnsureConvexUser";
import RedirectOnAuth from "@/components/auth/RedirectOnAuth";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { VoiceProvider } from "@/context/VoiceContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  const convex = getConvexClient();

  // If Convex URL isn't configured on the client, render children without provider
  if (!convex) return <>{children}</>;

  return (
    <ConvexClientProvider>
      <VoiceProvider>
        <ThemeProvider>
          <EnsureConvexUser />
          <RedirectOnAuth home="/home" />
          <SiteWideTouch />
          {children}
        </ThemeProvider>
      </VoiceProvider>
    </ConvexClientProvider>
  );
}

function SiteWideTouch() {
  const touch = useMutation(api.hub.analytics.mutations.touch);
  const me = useQuery(api.users.onboarding.queries.me, {});
  const firedRef = React.useRef(false);
  React.useEffect(() => {
    if (!firedRef.current && me) {
      firedRef.current = true;
      // Site-wide DAU/MAU touch; server is idempotent per day/month per user
      void touch({ hub: "site" }).catch(() => {
        firedRef.current = false; // allow retry on transient error
      });
    }
  }, [me, touch]);
  return null;
}


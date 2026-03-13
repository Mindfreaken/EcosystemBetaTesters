"use client";

import React from "react";
import ConvexClientProvider from '@/components/ConvexClientProvider'
import { getConvexClient } from "@/lib/convex";
import { ThemeProvider } from "@/components/home/shell/ShellContent/MainContent/content/theme/content/ThemeProvider";
import EnsureConvexUser from "@/components/auth/EnsureConvexUser";
import RedirectOnAuth from "@/components/auth/RedirectOnAuth";
import AppUpdater from "@/components/layout/AppUpdater";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { VoiceProvider } from "@/context/VoiceContext";
import { ClerkProvider } from "@clerk/clerk-react";
import { themeVar } from "@/theme/registry";

export default function Providers({ children }: { children: React.ReactNode }) {
  const convex = getConvexClient();

  // If Convex URL isn't configured on the client, render children without provider
  if (!convex) return <>{children}</>;

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      appearance={{
        variables: {
          colorPrimary: themeVar("primary"),
          colorBackground: themeVar("background"),
          colorText: themeVar("foreground"),
          colorTextSecondary: themeVar("mutedForeground"),
          colorInputBackground: 'var(--backgroundLight, #0f0f0f)',
          colorInputText: themeVar("foreground"),
          fontFamily: 'var(--font-geist-sans, Inter, system-ui, sans-serif)',
          borderRadius: '12px',
        },
        elements: {
          modalBackdrop: {
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          },
          card: {
            background: 'linear-gradient(180deg, color-mix(in oklab, var(--background), transparent 0%), color-mix(in oklab, var(--background), transparent 10%))',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid color-mix(in oklab, var(--foreground), transparent 92%)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
          },
          headerTitle: { color: themeVar("foreground") },
          headerSubtitle: { color: themeVar("mutedForeground") },
          formFieldLabel: { color: themeVar("mutedForeground") },
          formFieldInput: {
            backgroundColor: 'var(--backgroundLight, #0f0f0f)',
            color: themeVar("foreground"),
            borderColor: themeVar("border"),
          },
          // Make OTP (verification code) squares more visible without affecting other areas
          otpInput: {
            backgroundColor: 'var(--backgroundLight, #0f0f0f)',
            color: 'var(--foreground)',
            borderColor: 'color-mix(in oklab, var(--foreground), transparent 70%)',
            boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--foreground), transparent 70%)',
          },
          otpInput__selected: {
            borderColor: themeVar("primary"),
            boxShadow: `0 0 0 2px color-mix(in oklab, ${themeVar("primary")}, transparent 30%)`,
            backgroundColor: `color-mix(in oklab, ${themeVar("primary")}, ${themeVar("muted")} 85%)`,
          },
          formButtonPrimary: {
            backgroundColor: themeVar("primary"),
            color: themeVar("background")
          },
          footerActionText: { color: themeVar("mutedForeground") },
          footerActionLink: { color: themeVar("primary") },
        },
      }}
    >
      <ConvexClientProvider>
        <ThemeProvider>
          <AppUpdater />
          <EnsureConvexUser />
          <RedirectOnAuth home="/home" />
          <SiteWideTouch />
          <VoiceProvider>
            {children}
          </VoiceProvider>
        </ThemeProvider>
      </ConvexClientProvider>
    </ClerkProvider>
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




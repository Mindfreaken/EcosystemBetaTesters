"use client";

import { useEffect, useMemo, useState } from "react";
import FeatureGrid from "./FeatureGrid";
import AuthModal, { type AuthMode } from "@/components/modals/AuthModal";
import "./styles/Home.css";

interface HomeViewProps {
  onSkipSignIn?: () => void;
}

const HomeView = ({ onSkipSignIn }: HomeViewProps) => {
  // UI hover animations keep local state for transitions only
  const [/*ui*/, setUi] = useState(false);
  // Auth modal state
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signUp");
  // Ensure SSR and first client render match by deferring window access until mounted
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const colors = useMemo(() => {
    // Defaults should mirror the CSS variables' defaults to avoid visual jump
    const defaults = {
      background: "#0a0a0a",
      backgroundDark: "#000000",
      text: "#eaeaea",
      textSecondary: "#9ca3af",
      primary: "#6c47ff",
      secondary: "#ff2d55",
    } as const;

    if (!mounted) return defaults;

    const css = getComputedStyle(document.documentElement);
    const get = (name: string, fallback: string) => css.getPropertyValue(name)?.trim() || fallback;
    return {
      background: get("--background", defaults.background),
      backgroundDark: get("--background-dark", defaults.backgroundDark),
      text: get("--text", defaults.text),
      textSecondary: get("--text-secondary", defaults.textSecondary),
      primary: get("--primary", defaults.primary),
      secondary: get("--secondary", defaults.secondary),
    };
  }, [mounted]);

  const handleMouseOver = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    target.style.backgroundColor = colors.primary;
    target.style.boxShadow = `0 0 20px ${colors.primary}80, 0 0 10px ${colors.primary}40 inset`;
    target.style.textShadow = `0 0 8px ${colors.text}`;
    target.style.color = "#000000";
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    target.style.backgroundColor = "transparent";
    target.style.boxShadow = "none";
    target.style.textShadow = "none";
    target.style.color = colors.text;
  };

  const handlePrimaryMouseOver = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    target.style.boxShadow = `0 0 25px ${colors.primary}80, 0 0 15px ${colors.primary}40 inset`;
    target.style.textShadow = `0 0 8px ${colors.backgroundDark}`;
    target.style.transform = "translateY(-2px)";
  };

  const handlePrimaryMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    target.style.boxShadow = "none";
    target.style.textShadow = "none";
    target.style.transform = "translateY(0)";
  };

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div
      className="h-screen flex flex-col relative w-full"
      style={{
        background: `linear-gradient(145deg, ${colors.background} 0%, ${colors.backgroundDark} 100%)`,
        color: colors.text,
        height: "100vh",
        overflow: "auto",
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full">
        <section className="w-full flex flex-col justify-center items-center text-center px-4 py-12 md:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto w-full">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              <span
                className="bg-clip-text text-transparent bg-gradient-to-r"
                style={{
                  backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
                }}
              >
                Welcome to Your EcoSystem
              </span>
            </h1>

            <p
              className="text-lg sm:text-xl md:text-2xl mb-8 max-w-3xl mx-auto"
              style={{ color: colors.textSecondary }}
            >
              Your Digital Oasis for thriving online communities
            </p>

            <div
              className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6"
              style={{ flexDirection: "row" }}
            >
              <button
                className="px-6 sm:px-8 py-2 sm:py-3 rounded-full text-base sm:text-lg font-medium transition-all duration-300 border-2 neon-button-outline"
                style={{
                  borderColor: colors.primary,
                  color: colors.text,
                  backgroundColor: "transparent",
                }}
                onMouseOver={handleMouseOver}
                onMouseLeave={handleMouseLeave}
                onClick={() => openAuth("signIn")}
              >
                Login
              </button>

              <button
                className="px-6 sm:px-8 py-2 sm:py-3 rounded-full text-base sm:text-lg font-medium transition-all duration-300 neon-button-primary"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.background,
                }}
                onMouseOver={handlePrimaryMouseOver}
                onMouseLeave={handlePrimaryMouseLeave}
                onClick={() => openAuth("signUp")}
              >
                Get Started
              </button>
            </div>
          </div>
        </section>
      </div>

      <div
        className="absolute top-10 left-5 md:top-20 md:left-10 w-32 md:w-64 h-32 md:h-64 rounded-full opacity-20 blur-xl"
        style={{ background: `radial-gradient(circle, ${colors.primary} 0%, transparent 70%)` }}
      />
      <div
        className="absolute bottom-10 right-5 md:bottom-20 md:right-10 w-40 md:w-80 h-40 md:h-80 rounded-full opacity-20 blur-xl"
        style={{ background: `radial-gradient(circle, ${colors.secondary} 0%, transparent 70%)` }}
      />

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        signInRedirectUrl="/home"
        signInFallbackRedirectUrl="/home"
        signUpRedirectUrl="/home"
        signUpFallbackRedirectUrl="/home"
      />
    </div>
  );
};

export default HomeView;


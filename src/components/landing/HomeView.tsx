"use client";

import { useEffect, useMemo, useState } from "react";
import FeatureGrid from "./FeatureGrid";
import AuthModal, { type AuthMode } from "@/components/modals/AuthModal";
import "./styles/Home.css";

interface HomeViewProps {
  onSkipSignIn?: () => void;
}

const HomeView = ({ onSkipSignIn }: HomeViewProps) => {
  // Auth modal state
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signUp");
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    // Check if running in Tauri environment
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      setIsTauri(true);
    }
  }, []);

  // Note: we no longer need the complex `useMemo` for colors. 
  // We use CSS variables directly so it stays in sync with ThemeProvider,
  // and prevents Opera GX from "force dark mode" overriding JS inline hexes.

  const handleMouseOver = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    target.style.backgroundColor = 'var(--primary)';
    // Use color-mix to simulate transparency on the neon glow
    target.style.boxShadow = `0 0 20px color-mix(in oklab, var(--primary), transparent 50%), 0 0 10px color-mix(in oklab, var(--primary), transparent 75%) inset`;
    target.style.textShadow = `0 0 8px var(--text)`;
    target.style.color = 'var(--background)'; // Invert text against primary bg
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    target.style.backgroundColor = "transparent";
    target.style.boxShadow = "none";
    target.style.textShadow = "none";
    target.style.color = 'var(--text)';
  };

  const handlePrimaryMouseOver = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    target.style.boxShadow = `0 0 25px color-mix(in oklab, var(--primary), transparent 50%), 0 0 15px color-mix(in oklab, var(--primary), transparent 75%) inset`;
    target.style.textShadow = `0 0 8px var(--backgroundDark, #000)`;
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
        background: `linear-gradient(145deg, var(--background) 0%, var(--backgroundDark, #000) 100%)`,
        color: 'var(--text)',
        height: "100vh",
        overflow: "auto",
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full">
        <section className="w-full flex flex-col justify-center items-center text-center px-4 py-12 md:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex justify-center mb-8">
              <div className="relative group">
                {/* Logo with interactive glow effect */}
                <div
                  className="absolute -inset-4 rounded-full opacity-30 blur-2xl transition-all duration-500 group-hover:opacity-50"
                  style={{ background: `radial-gradient(circle, var(--primary) 0%, transparent 70%)` }}
                />
                <img
                  src="/achievements/early_adopter_sticker.png"
                  alt="Ecosystem Logo"
                  className="w-32 h-32 md:w-40 md:h-40 relative z-10 transition-transform duration-500 group-hover:scale-105"
                  style={{ filter: "drop-shadow(0 0 15px color-mix(in oklab, var(--primary), transparent 60%))" }}
                />
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              <span
                className="bg-clip-text text-transparent bg-gradient-to-r"
                style={{
                  backgroundImage: `linear-gradient(to right, var(--primary), var(--secondary))`,
                }}
              >
                Welcome to Your EcoSystem
              </span>
            </h1>

            <p
              className="text-lg sm:text-xl md:text-2xl mb-8 max-w-3xl mx-auto"
              style={{ color: 'var(--textSecondary)' }}
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
                  borderColor: 'var(--primary)',
                  color: 'var(--text)',
                  backgroundColor: "transparent",
                }}
                onMouseOver={handleMouseOver}
                onMouseLeave={handleMouseLeave}
                onClick={() => openAuth("signIn")}
              >
                Login
              </button>

              {!isTauri && (
                <button
                  className="px-6 sm:px-8 py-2 sm:py-3 rounded-full text-base sm:text-lg font-medium transition-all duration-300 border-2 neon-button-outline"
                  style={{
                    borderColor: 'var(--secondary)',
                    color: 'var(--text)',
                    backgroundColor: "transparent",
                  }}
                  onMouseOver={(e) => {
                    const target = e.currentTarget;
                    target.style.backgroundColor = 'var(--secondary)';
                    target.style.boxShadow = `0 0 20px color-mix(in oklab, var(--secondary), transparent 50%), 0 0 10px color-mix(in oklab, var(--secondary), transparent 75%) inset`;
                    target.style.textShadow = `0 0 8px var(--text)`;
                    target.style.color = 'var(--background)';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget;
                    target.style.backgroundColor = "transparent";
                    target.style.boxShadow = "none";
                    target.style.textShadow = "none";
                    target.style.color = 'var(--text)';
                  }}
                  onClick={() => window.open("https://github.com/Mindfreaken/EcosystemBetaTesters/releases/latest", "_blank")}
                >
                  Download
                </button>
              )}

              <button
                className="px-6 sm:px-8 py-2 sm:py-3 rounded-full text-base sm:text-lg font-medium transition-all duration-300 neon-button-primary"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--background)',
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

      {/* Decorative blurred circles parsing CSS theme vars */}
      <div
        className="absolute top-10 left-5 md:top-20 md:left-10 w-32 md:w-64 h-32 md:h-64 rounded-full opacity-20 blur-xl"
        style={{ background: `radial-gradient(circle, var(--primary) 0%, transparent 70%)` }}
      />
      <div
        className="absolute bottom-10 right-5 md:bottom-20 md:right-10 w-40 md:w-80 h-40 md:h-80 rounded-full opacity-20 blur-xl"
        style={{ background: `radial-gradient(circle, var(--secondary) 0%, transparent 70%)` }}
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


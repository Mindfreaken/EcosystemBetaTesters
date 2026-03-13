"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import zxcvbn from "zxcvbn";
import * as ClerkElements from '@clerk/elements/common'
import * as SignUpPrimitive from '@clerk/elements/sign-up'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/clerk-react'
import Image from 'next/image'
import { useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { themeVar } from "@/theme/registry";

// Elements-based Sign Up collecting: username, displayName, dateOfBirth
// displayName and dateOfBirth are stored in publicMetadata

export default function SignUpElements({
  redirectUrl = "/home",
  className,
}: {
  redirectUrl?: string;
  className?: string;
}) {
  const router = useRouter();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [emailEntered, setEmailEntered] = useState("");
  const { isSignedIn, getToken, isLoaded: isAuthLoaded } = useAuth();
  const { user } = useUser();
  const convex = useConvex();
  const hasOnboardedRef = useRef(false);
  // Local mirrors of Clerk fields for validation and UX
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [dobInput, setDobInput] = useState(""); // yyyy-mm-dd
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [displayNameTaken, setDisplayNameTaken] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const availabilityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [passwordInput, setPasswordInput] = useState("");

  const scheduleAvailabilityCheck = (u: string, d: string) => {
    if (availabilityTimerRef.current) clearTimeout(availabilityTimerRef.current);
    availabilityTimerRef.current = setTimeout(async () => {
      try {
        setCheckingAvailability(true);
        const res = await convex.query(api.users.onboarding.validation.checkExistingUserFields, {
          username: u?.trim() ? u.trim() : undefined,
          displayName: d?.trim() ? d.trim() : undefined,
        });
        setUsernameTaken(!!res?.usernameExists);
        setDisplayNameTaken(!!res?.displayNameExists);
      } catch (e) {
        // Non-fatal; keep previous state
      } finally {
        setCheckingAvailability(false);
      }
    }, 300);
  };

  useEffect(() => {
    scheduleAvailabilityCheck(username, displayName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, displayName]);

  // After Clerk sign-up/sign-in completes, ensure the user exists in Convex
  useEffect(() => {
    const run = async () => {
      if (!isSignedIn || !isAuthLoaded || hasOnboardedRef.current) return;
      try {
        // Ensure Convex client is authenticated with Clerk OIDC/JWT before mutation
        const token = await getToken({ template: "convex" });
        if (token) {
          convex.setAuth(() => Promise.resolve(token));
        }

        // Pull data from Clerk user profile
        // Reload user to ensure latest metadata from Elements is present
        try { await user?.reload?.(); } catch { }
        const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || "";
        const clerkUsername = user?.username || undefined;
        const displayNameMeta = (user?.publicMetadata as any)?.displayName as string | undefined;
        const resolvedDisplayName = (displayNameMeta && displayNameMeta.trim().length > 0)
          ? displayNameMeta
          : clerkUsername || email.split("@")[0] || "User";
        const dobMeta = (user?.publicMetadata as any)?.dateOfBirth as string | number | undefined;
        let dateOfBirth: number | undefined = undefined;
        if (typeof dobMeta === "number") {
          dateOfBirth = dobMeta;
        } else if (typeof dobMeta === "string" && dobMeta) {
          const t = Date.parse(dobMeta);
          if (!Number.isNaN(t)) dateOfBirth = t;
        }
        // Normalize to ms timestamp (convert seconds -> ms if needed)
        if (typeof dateOfBirth === 'number' && dateOfBirth > 0 && dateOfBirth < 1e12) {
          dateOfBirth = Math.floor(dateOfBirth * 1000);
        }
        // If username is provided by Clerk but DOB is missing, block onboarding so DOB doesn't save as 0
        if (clerkUsername && (dateOfBirth === undefined || Number.isNaN(dateOfBirth as any))) {
          setSignupError("Please provide a valid date of birth to continue.");
          return;
        }

        // Call Convex to ensure/create the user
        await convex.mutation(api.users.onboarding.onboarding.ensureUser, {
          email,
          displayName: resolvedDisplayName,
          username: clerkUsername,
          dateOfBirth,
        });

        hasOnboardedRef.current = true;
        router.replace(redirectUrl);
        router.refresh();
      } catch (err) {
        console.error("Failed to ensure user in Convex after sign-up:", err);
        // Redirect anyway to avoid blocking the user in auth UI
        router.replace(redirectUrl);
        router.refresh();
      }
    };
    void run();
  }, [isSignedIn, isAuthLoaded, getToken, user, convex, redirectUrl, router]);

  // Reuse landing theme vars for a cohesive look
  const colors = useMemo(() => ({
    background: themeVar("background"),
    text: themeVar("foreground"),
    textSecondary: themeVar("mutedForeground"),
    primary: themeVar("primary"),
    secondary: themeVar("secondary")
  }), []);

  const inputClass = "themed-input w-full rounded-xl px-3 py-2 transition";
  const primaryBtnClass = "w-full rounded-xl text-sm font-medium h-11 px-4 shadow-md hover:opacity-95 transition";

  const getPasswordStrength = (value: string) => {
    if (!value) return { label: "", percent: 0, color: "bg-foreground/5" };
    const result = zxcvbn(value);
    const score = result.score; // 0 (worst) - 4 (best)

    if (score <= 1) return { label: "Weak", percent: 25, color: "bg-red-500" };
    if (score === 2) return { label: "Fair", percent: 40, color: "bg-orange-500" };
    if (score === 3) return { label: "Good", percent: 65, color: "bg-yellow-400" };
    return { label: "Strong", percent: 100, color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(passwordInput);

  return (
    <div className={className} style={{ color: colors.text }}>
      <div
        className="w-[380px] rounded-2xl border border-border shadow-2xl px-6 py-6 bg-card/60 backdrop-blur-xl"
      >
        <div className="mb-5 text-left">
          <div className="relative mb-3 h-11 w-11">
            {/* soft outer glow */}
            <div
              className="absolute inset-0 -z-10 rounded-full blur-md opacity-70"
              style={{
                backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              }}
            />
            {/* gradient ring */}
            <div
              className="h-11 w-11 rounded-full p-[2px]"
              style={{
                backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              }}
            >
              <div className="h-full w-full rounded-full p-[2px] bg-muted/80">
                <Image
                  src="/achievements/early_adopter_sticker.png"
                  alt="App badge"
                  width={40}
                  height={40}
                  className="h-full w-full rounded-full object-cover"
                  priority
                />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-semibold">Create your account</h2>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Join the ecosystem — it takes less than a minute
          </p>
        </div>
        <SignUpPrimitive.Root routing="hash">
          {/* Start step: email + password */}
          <SignUpPrimitive.Step name="start">
            <div className="space-y-4">
              <ClerkElements.Field name="emailAddress">
                <ClerkElements.Label className="block text-sm">Email</ClerkElements.Label>
                <ClerkElements.Input
                  type="email"
                  className={inputClass}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailEntered(e.target.value)}
                />
                <ClerkElements.FieldError className="text-sm text-red-400" />
              </ClerkElements.Field>

              <ClerkElements.Field name="password">
                <ClerkElements.Label className="block text-sm">Password</ClerkElements.Label>
                <ClerkElements.Input
                  type="password"
                  className={inputClass}
                  minLength={8 as any}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordInput(e.target.value)}
                />
                <ClerkElements.FieldError className="text-sm text-red-400" />
              </ClerkElements.Field>

              <p className="text-xs" style={{ color: colors.textSecondary }}>
                Use a strong, unique password. Longer phrases with a mix of letters, numbers, and symbols work best. Weak or compromised passwords will be rejected.
              </p>

              {strength.label && (
                <div className="space-y-1">
                  <div className="mt-1 h-1.5 w-full rounded-full bg-foreground/5 overflow-hidden">
                    <div
                      className={`h-full transition-all ${strength.color}`}
                      style={{ width: `${strength.percent}%` }}
                    />
                  </div>
                  <p className="text-[11px]" style={{ color: colors.textSecondary }}>
                    Strength: {strength.label}
                  </p>
                </div>
              )}

              {/* Hidden placeholder for Clerk Smart CAPTCHA (prevents fallback warning). */}
              <div id="clerk-captcha" aria-hidden className="sr-only" />

              <SignUpPrimitive.Action
                submit
                className={primaryBtnClass}
                style={{
                  backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  color: '#0a0a0a'
                }}
              >
                Continue
              </SignUpPrimitive.Action>
            </div>
          </SignUpPrimitive.Step>

          {/* Continue step: username + extra profile fields */}
          <SignUpPrimitive.Step name="continue">
            <div className="space-y-4 w-[320px]">
              <div className="grid grid-cols-2 gap-3">
                <ClerkElements.Field name="firstName">
                  <ClerkElements.Label className="block text-sm">First name</ClerkElements.Label>
                  <ClerkElements.Input className={inputClass} />
                  <ClerkElements.FieldError className="text-sm text-red-400" />
                </ClerkElements.Field>
                <ClerkElements.Field name="lastName">
                  <ClerkElements.Label className="block text-sm">Last name</ClerkElements.Label>
                  <ClerkElements.Input className={inputClass} />
                  <ClerkElements.FieldError className="text-sm text-red-400" />
                </ClerkElements.Field>
              </div>

              <ClerkElements.Field name="username">
                <ClerkElements.Label className="block text-sm">Username</ClerkElements.Label>
                <ClerkElements.Input
                  className={inputClass}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value.slice(0, 20))}
                  maxLength={20 as any}
                />
                <ClerkElements.FieldError className="text-sm text-red-400" />
              </ClerkElements.Field>
              {username && usernameTaken && (
                <p className="text-xs text-red-400">This username is already taken.</p>
              )}

              <ClerkElements.Field name="publicMetadata.displayName">
                <ClerkElements.Label className="block text-sm">Display name</ClerkElements.Label>
                <ClerkElements.Input
                  className={inputClass}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value.slice(0, 20))}
                  maxLength={20 as any}
                />
                <ClerkElements.FieldError className="text-sm text-red-400" />
              </ClerkElements.Field>
              {displayName && displayNameTaken && (
                <p className="text-xs text-red-400">This display name is already taken.</p>
              )}

              <ClerkElements.Field name="publicMetadata.dateOfBirth">
                <ClerkElements.Label className="block text-sm">Date of birth</ClerkElements.Label>
                <ClerkElements.Input
                  type="date"
                  className={inputClass}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDobInput(e.target.value)}
                />
                <ClerkElements.FieldError className="text-sm text-red-400" />
              </ClerkElements.Field>

              <div className="flex items-start gap-2 py-1">
                <input
                  id="terms"
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-border/50 bg-background/40"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                <label htmlFor="terms" className="text-xs" style={{ color: colors.textSecondary }}>
                  I agree to the Terms of Service and Privacy Policy
                </label>
              </div>

              <SignUpPrimitive.Action
                submit
                disabled={
                  !acceptedTerms ||
                  checkingAvailability ||
                  usernameTaken ||
                  displayNameTaken ||
                  !username.trim() ||
                  !displayName.trim() ||
                  !dobInput.trim() ||
                  username.length > 20 ||
                  displayName.length > 20
                }
                className={primaryBtnClass}
                style={{
                  backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  color: '#0a0a0a'
                }}
              >
                Create account
              </SignUpPrimitive.Action>
              {signupError && (
                <p className="text-sm text-red-400">{signupError}</p>
              )}
            </div>
          </SignUpPrimitive.Step>

          {/* Verification step: email code */}
          <SignUpPrimitive.Step name="verifications">
            <SignUpPrimitive.Strategy name="email_code">
              <div className="space-y-4">
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  Verification code sent to {emailEntered || 'your email'}
                </p>
                <ClerkElements.Field name="code">
                  <ClerkElements.Label className="block text-sm">Verification code</ClerkElements.Label>
                  <ClerkElements.Input className="w-full rounded-xl bg-foreground/5 border border-border/50 px-3 py-2 tracking-widest text-center text-foreground outline-none focus:border-primary/50 transition-all" />
                  <ClerkElements.FieldError className="text-sm text-red-400" />
                </ClerkElements.Field>

                <SignUpPrimitive.Action
                  submit
                  className={primaryBtnClass}
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    color: '#0a0a0a'
                  }}
                >
                  Verify & Continue
                </SignUpPrimitive.Action>

                <SignUpPrimitive.Action
                  resend
                  className="block text-sm"
                  style={{ color: 'var(--primary, #6c47ff)' }}
                  fallback={({ resendableAfter }) => (
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      Resend code in {resendableAfter}s
                    </p>
                  )}
                >
                  Resend code
                </SignUpPrimitive.Action>
              </div>
            </SignUpPrimitive.Strategy>
          </SignUpPrimitive.Step>
        </SignUpPrimitive.Root>
      </div>
    </div>
  );
}



"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import zxcvbn from "zxcvbn";
import * as Clerk from '@clerk/elements/common'
import * as SignUp from '@clerk/elements/sign-up'
import { useRouter } from 'next/navigation'
import { useAuth, useUser, useSignUp } from '@clerk/nextjs'
import Image from 'next/image'
import { useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";

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
  const { isLoaded: isSignUpLoaded, signUp, setActive } = useSignUp();
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
  const [performingAction, setPerformingAction] = useState(false);

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
        const token = await getToken({ template: "convex" });
        if (token) {
          convex.setAuth(() => Promise.resolve(token));
        }

        const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || "";
        const usernameVal = user?.username || undefined;

        // Metadata handling
        const displayNameMeta = (user?.publicMetadata as any)?.displayName as string | undefined;
        const displayNameVal = (displayNameMeta && displayNameMeta.trim().length > 0)
          ? displayNameMeta
          : usernameVal || email.split("@")[0] || "User";

        const dobMeta = (user?.publicMetadata as any)?.dateOfBirth as string | number | undefined;
        let dateOfBirth: number | undefined = undefined;
        if (typeof dobMeta === "number") {
          dateOfBirth = dobMeta;
        } else if (typeof dobMeta === "string" && dobMeta) {
          const t = Date.parse(dobMeta);
          if (!Number.isNaN(t)) dateOfBirth = t;
        }
        if (dateOfBirth === undefined || Number.isNaN(dateOfBirth as any)) {
          dateOfBirth = undefined;
        }
        if (typeof dateOfBirth === 'number' && dateOfBirth > 0 && dateOfBirth < 1e12) {
          dateOfBirth = Math.floor(dateOfBirth * 1000);
        }

        await convex.mutation(api.users.onboarding.onboarding.ensureUser, {
          email,
          displayName: displayNameVal,
          username: usernameVal,
          dateOfBirth,
        });
        hasOnboardedRef.current = true;
        router.replace(redirectUrl);
        router.refresh();
      } catch (err) {
        console.error("Failed to ensure user in Convex after sign-up:", err);
        router.replace(redirectUrl);
        router.refresh();
      }
    };
    void run();
  }, [isSignedIn, isAuthLoaded, getToken, user, convex, redirectUrl, router]);

  // Reuse landing theme vars for a cohesive look
  const colors = useMemo(() => ({
    background: 'var(--background, #0a0a0a)',
    backgroundDark: 'var(--backgroundDark, #000000)',
    text: 'var(--text, #eaeaea)',
    textSecondary: 'var(--textSecondary, #9ca3af)',
    primary: 'var(--primary, #6c47ff)',
    secondary: 'var(--secondary, #ff2d55)'
  }), []);

  const strength = useMemo(() => {
    if (!passwordInput) return { label: "", percent: 0, color: "bg-white/10" };
    const result = zxcvbn(passwordInput);
    const score = result.score; // 0-4
    const colorsArr = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-emerald-500"];
    const labels = ["Very Weak", "Weak", "Fair", "Strong", "Excellent"];
    return {
      label: labels[score],
      percent: (score + 1) * 20,
      color: colorsArr[score]
    };
  }, [passwordInput]);

  const handleSignUpSubmit = async () => {
    if (!acceptedTerms) return;
    setPerformingAction(true);
    setSignupError(null);
    // Extra local metadata setting happens in Clerk's built-in field mapping or via Clerk hooks
  };

  const inputClass = "themed-input w-full rounded-xl px-3 py-2 transition text-white text-sm bg-white/5 border border-white/10 outline-none focus:border-white/20 focus:ring-1 focus:ring-indigo-500/50";
  const primaryBtnClass = "w-full rounded-xl text-sm font-bold h-11 px-4 shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2";

  return (
    <div className={className} style={{ color: colors.text }}>
      <div
        className="w-[380px] rounded-2xl border shadow-2xl px-6 py-6"
        style={{ backgroundColor: 'var(--backgroundLight, #0f0f0f)', borderColor: 'var(--card-border)' }}
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
              <div className="h-full w-full rounded-full p-[2px]" style={{ backgroundColor: 'var(--backgroundLight, #0f0f0f)' }}>
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
        <SignUp.Root>
          <SignUp.Step name="start">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Clerk.Field name="username">
                  <Clerk.Label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 block">Username</Clerk.Label>
                  <Clerk.Input
                    className={inputClass}
                    placeholder="CoolGamer123"
                    value={username}
                    onChange={(e: any) => {
                      setUsername(e.target.value);
                      scheduleAvailabilityCheck(e.target.value, displayName);
                    }}
                  />
                  <Clerk.FieldError className="text-[10px] text-red-400 mt-1 font-medium" />
                  {username.length >= 3 && !usernameTaken && !checkingAvailability && <p className="text-[10px] text-emerald-400 mt-1">Username available</p>}
                  {usernameTaken && <p className="text-[10px] text-red-400 mt-1">Username is already taken</p>}
                </Clerk.Field>

                <Clerk.Field name="displayName">
                  <Clerk.Label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 block">Display Name</Clerk.Label>
                  <Clerk.Input
                    className={inputClass}
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e: any) => {
                      setDisplayName(e.target.value);
                      scheduleAvailabilityCheck(username, e.target.value);
                    }}
                  />
                  <Clerk.FieldError className="text-[10px] text-red-400 mt-1 font-medium" />
                  {displayName.length >= 2 && !displayNameTaken && !checkingAvailability && <p className="text-[10px] text-emerald-400 mt-1">Display name unique</p>}
                  {displayNameTaken && <p className="text-[10px] text-red-400 mt-1">Display name is taken</p>}
                </Clerk.Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Clerk.Field name="emailAddress">
                  <Clerk.Label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 block">Email</Clerk.Label>
                  <Clerk.Input
                    type="email"
                    className={inputClass}
                    placeholder="you@example.com"
                    value={emailEntered}
                    onChange={(e: any) => setEmailEntered(e.target.value)}
                  />
                  <Clerk.FieldError className="text-[10px] text-red-400 mt-1 font-medium" />
                </Clerk.Field>

                <Clerk.Field name="dateOfBirth">
                  <Clerk.Label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 block">Birthday</Clerk.Label>
                  <Clerk.Input
                    type="date"
                    className={inputClass}
                    value={dobInput}
                    onChange={(e: any) => setDobInput(e.target.value)}
                  />
                  <Clerk.FieldError className="text-[10px] text-red-400 mt-1 font-medium" />
                </Clerk.Field>
              </div>

              <Clerk.Field name="password">
                <Clerk.Label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 block">Password</Clerk.Label>
                <Clerk.Input
                  type="password"
                  className={inputClass}
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e: any) => setPasswordInput(e.target.value)}
                />
                <Clerk.FieldError className="text-[10px] text-red-400 mt-1 font-medium" />

                {passwordInput && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${strength.color}`}
                        style={{ width: `${strength.percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: strength.color.replace('bg-', 'text-') }}>
                        {strength.label}
                      </span>
                      <span className="text-[10px] text-gray-500 italic">Ideal: 8+ chars, mixed cases/symbols</span>
                    </div>
                  </div>
                )}
              </Clerk.Field>

              {/* Hidden placeholder for Clerk Smart CAPTCHA (prevents fallback warning). */}
              <div id="clerk-captcha" aria-hidden className="sr-only" />

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 h-3.5 w-3.5 rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-indigo-500/50 cursor-pointer"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                <label htmlFor="terms" className="text-[11px] text-gray-400 leading-snug cursor-pointer select-none">
                  I agree to the <span className="text-indigo-400 hover:underline">Terms of Service</span> and <span className="text-indigo-400 hover:underline">Privacy Policy</span>.
                </label>
              </div>

              {signupError && <p className="text-xs text-red-400 font-medium">{signupError}</p>}

              <SignUp.Action
                submit
                className={primaryBtnClass}
                disabled={performingAction || !acceptedTerms || usernameTaken || displayNameTaken || checkingAvailability || !username || !displayName || !passwordInput}
                onClick={handleSignUpSubmit}
                style={{
                  backgroundImage: acceptedTerms && !usernameTaken && !displayNameTaken && !checkingAvailability && username && displayName && passwordInput
                    ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                    : 'none',
                  backgroundColor: acceptedTerms && !usernameTaken && !displayNameTaken && !checkingAvailability && username && displayName && passwordInput
                    ? 'transparent'
                    : 'rgba(255,255,255,0.05)',
                  color: acceptedTerms && !usernameTaken && !displayNameTaken && !checkingAvailability && username && displayName && passwordInput
                    ? '#0a0a0a'
                    : 'rgba(255,255,255,0.2)',
                  cursor: (acceptedTerms && !usernameTaken && !displayNameTaken && !checkingAvailability && username && displayName && passwordInput) ? 'pointer' : 'not-allowed'
                }}
              >
                <SignUp.Loading>
                  {(is: any) => is ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : "Create Account"}
                </SignUp.Loading>
              </SignUp.Action>

              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="h-[1px] flex-1 bg-white/5" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Or use social</span>
                <div className="h-[1px] flex-1 bg-white/5" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SignUp.Action
                  navigate="previous"
                  className="flex items-center justify-center gap-2 rounded-xl bg-white/3 border border-white/5 h-10 text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:bg-white/5 hover:text-white transition-all shadow-sm"
                >
                  Back
                </SignUp.Action>
              </div>
            </div>
          </SignUp.Step>

          <SignUp.Step name="verifications">
            <SignUp.Strategy name="email_code">
              <div className="space-y-4 w-[350px]">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Check your email</h3>
                  <p className="text-xs text-gray-400">
                    We sent a 6-digit verification code to <span className="text-white font-medium">{emailEntered || 'your email'}</span>.
                  </p>
                </div>

                <Clerk.Field name="code">
                  <Clerk.Label className="sr-only">Verification Code</Clerk.Label>
                  <div className="flex justify-center">
                    <Clerk.Input
                      className="w-full max-w-[200px] text-3xl font-bold tracking-[0.5em] text-center bg-white/5 border-2 border-white/10 rounded-2xl py-4 focus:border-indigo-500 focus:ring-0 transition-all text-white placeholder:text-white/5"
                      placeholder="000000"
                    />
                  </div>
                  <Clerk.FieldError className="text-[11px] text-red-400 mt-2 text-center font-medium" />
                </Clerk.Field>

                <SignUp.Action
                  submit
                  className={primaryBtnClass}
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    color: '#0a0a0a'
                  }}
                >
                  <SignUp.Loading>
                    {(is: any) => is ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mx-auto" /> : "Verify & Continue"}
                  </SignUp.Loading>
                </SignUp.Action>

                <div className="text-center">
                  <SignUp.Action
                    resend
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium py-2 px-4 rounded-lg hover:bg-white/5 transition-all"
                    fallback={({ resendableAfter }) => (
                      <span className="text-xs text-gray-500 italic">
                        Resend code in <span className="font-bold text-gray-400">{resendableAfter}s</span>
                      </span>
                    )}
                  >
                    Resend verification code
                  </SignUp.Action>
                </div>
              </div>
            </SignUp.Strategy>
          </SignUp.Step>
        </SignUp.Root>
      </div >
    </div >
  );
}

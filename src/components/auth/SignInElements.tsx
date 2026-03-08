"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as Clerk from '@clerk/elements/common'
import * as SignIn from '@clerk/elements/sign-in'
import { useRouter } from 'next/navigation'
import { useAuth, useUser, useSignIn } from '@clerk/nextjs'
import Image from 'next/image'
import { useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import zxcvbn from "zxcvbn";

export default function SignInElements({
  redirectUrl = "/home",
  className,
}: {
  redirectUrl?: string;
  className?: string;
}) {
  const router = useRouter();
  const { isSignedIn, isLoaded: isAuthLoaded, getToken } = useAuth();
  const { user } = useUser();
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const convex = useConvex();
  const hasOnboardedRef = useRef(false);
  const [identifierEntered, setIdentifierEntered] = React.useState("");
  const [forgotMode, setForgotMode] = React.useState<"none" | "request" | "reset">("none");
  const [resetEmail, setResetEmail] = React.useState("");
  const [resetCode, setResetCode] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [resetError, setResetError] = React.useState<string | null>(null);
  const [resetLoading, setResetLoading] = React.useState(false);
  const [resetSuccess, setResetSuccess] = React.useState(false);

  // After sign-in completes, ensure the user exists in Convex before redirect
  useEffect(() => {
    const run = async () => {
      if (!isSignedIn || !isAuthLoaded || hasOnboardedRef.current) return;
      try {
        const token = await getToken({ template: "convex" });
        if (token) {
          convex.setAuth(() => Promise.resolve(token));
        }

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
        // If not available, leave undefined (do not coerce to 0)
        if (dateOfBirth === undefined || Number.isNaN(dateOfBirth as any)) {
          dateOfBirth = undefined;
        }
        // Normalize to ms timestamp (convert seconds -> ms if needed)
        if (typeof dateOfBirth === 'number' && dateOfBirth > 0 && dateOfBirth < 1e12) {
          dateOfBirth = Math.floor(dateOfBirth * 1000);
        }

        // No username confirmation required in sign-in flow

        await convex.mutation(api.users.onboarding.onboarding.ensureUser, {
          email,
          displayName,
          username,
          dateOfBirth,
        });
        hasOnboardedRef.current = true;
        router.replace(redirectUrl);
        router.refresh();
      } catch (err) {
        console.error("Failed to ensure user in Convex after sign-in:", err);
        router.replace(redirectUrl);
        router.refresh();
      }
    };
    void run();
  }, [isSignedIn, isAuthLoaded, getToken, user, convex, redirectUrl, router]);
  const colors = useMemo(() => ({
    background: 'var(--background, #0a0a0a)',
    backgroundDark: 'var(--backgroundDark, #000000)',
    text: 'var(--text, #eaeaea)',
    textSecondary: 'var(--textSecondary, #9ca3af)',
    primary: 'var(--primary, #6c47ff)',
    secondary: 'var(--secondary, #ff2d55)'
  }), []);
  const inputClass = "themed-input w-full rounded-xl px-3 py-2 transition";
  const primaryBtnClass = "w-full rounded-xl text-sm font-medium h-11 px-4 shadow-md hover:opacity-95 transition";

  const getPasswordStrength = (value: string) => {
    if (!value) return { label: "", percent: 0, color: "bg-white/10" };
    const result = zxcvbn(value);
    const score = result.score; // 0 (worst) - 4 (best)

    if (score <= 1) return { label: "Weak", percent: 25, color: "bg-red-500" };
    if (score === 2) return { label: "Fair", percent: 40, color: "bg-orange-500" };
    if (score === 3) return { label: "Good", percent: 65, color: "bg-yellow-400" };
    return { label: "Strong", percent: 100, color: "bg-emerald-500" };
  };

  const resetStrength = getPasswordStrength(newPassword);

  const handleStartForgot = () => {
    setResetEmail(identifierEntered || "");
    setResetCode("");
    setNewPassword("");
    setResetError(null);
    setResetSuccess(false);
    setForgotMode("request");
  };

  const submitForgotRequest: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!isSignInLoaded || !signIn) return;
    setResetError(null);
    setResetLoading(true);
    try {
      const attempt = await (signIn as any).create({
        strategy: "reset_password_email_code" as any,
        identifier: resetEmail,
      });

      // If Clerk requires first factor verification with a code, move to reset step
      if (attempt?.status === "needs_first_factor") {
        setForgotMode("reset");
      } else if (attempt?.status === "complete") {
        // In some cases the flow can complete immediately
        await setActive?.({ session: attempt.createdSessionId });
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message || err?.message || "Failed to send reset code";
      setResetError(msg);
    } finally {
      setResetLoading(false);
    }
  };

  const submitPasswordReset: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!isSignInLoaded || !signIn) return;
    setResetError(null);
    setResetLoading(true);
    try {
      const attempt = await (signIn as any).attemptFirstFactor({
        strategy: "reset_password_email_code" as any,
        code: resetCode,
        password: newPassword,
      });

      if (attempt?.status === "complete") {
        await setActive?.({ session: attempt.createdSessionId });
        setResetSuccess(true);
        // Redirect is handled by the existing Convex onboarding effect,
        // but also navigate explicitly to avoid stale UI after reset.
        try {
          router.replace(redirectUrl);
          router.refresh();
        } catch {
          // If navigation fails, rely on the onboarding effect
        }
      } else {
        setResetError("Password reset not complete. Please check the code and try again.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message || err?.message || "Failed to reset password";
      setResetError(msg);
    } finally {
      setResetLoading(false);
    }
  };

  if (forgotMode !== "none") {
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
            <h2 className="text-2xl font-semibold">
              {forgotMode === "request" ? "Forgot password" : "Reset your password"}
            </h2>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {forgotMode === "request"
                ? "Enter your email and we'll send you a code to reset your password."
                : "Enter the code from your email and choose a new password."}
            </p>
          </div>

          {forgotMode === "request" ? (
            <form onSubmit={submitForgotRequest} className="space-y-4 w-[320px]">
              <div className="space-y-2">
                <label className="block text-sm">Email</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>
              {resetError && <p className="text-sm text-red-400">{resetError}</p>}
              <button
                type="submit"
                disabled={resetLoading || !resetEmail}
                className={primaryBtnClass}
                style={{
                  backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  color: '#0a0a0a',
                }}
              >
                {resetLoading ? "Sending code..." : "Send reset code"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForgotMode("none");
                  setResetError(null);
                }}
                className="block text-sm mt-1"
                style={{ color: colors.textSecondary }}
              >
                Back to sign in
              </button>
            </form>
          ) : resetSuccess ? (
            <div className="space-y-4 w-[320px]">
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Your password has been reset successfully.
              </p>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                You should be signed in automatically. If nothing happens, you can close this window and sign in with your new password.
              </p>
              <button
                type="button"
                onClick={() => {
                  setForgotMode("none");
                  setResetError(null);
                  setResetSuccess(false);
                }}
                className={primaryBtnClass}
                style={{
                  backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  color: '#0a0a0a',
                }}
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={submitPasswordReset} className="space-y-4 w-[320px]">
              <div className="space-y-2">
                <label className="block text-sm">Verification code</label>
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="123456"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className={inputClass}
                  placeholder="Create a new password"
                />
              </div>
              {resetStrength.label && (
                <div className="space-y-1">
                  <div className="mt-1 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full transition-all ${resetStrength.color}`}
                      style={{ width: `${resetStrength.percent}%` }}
                    />
                  </div>
                  <p className="text-[11px]" style={{ color: colors.textSecondary }}>
                    Strength: {resetStrength.label}
                  </p>
                </div>
              )}
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                Choose a strong, unique password. Longer phrases with a mix of letters, numbers, and symbols work best. Weak or compromised passwords will be rejected.
              </p>
              {resetError && <p className="text-sm text-red-400">{resetError}</p>}
              <button
                type="submit"
                disabled={resetLoading || !resetCode || !newPassword}
                className={primaryBtnClass}
                style={{
                  backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  color: '#0a0a0a',
                }}
              >
                {resetLoading ? "Resetting..." : "Reset password"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForgotMode("request");
                  setResetError(null);
                }}
                className="block text-sm mt-1"
                style={{ color: colors.textSecondary }}
              >
                Back to email step
              </button>
              <button
                type="button"
                onClick={() => {
                  setForgotMode("none");
                  setResetError(null);
                }}
                className="block text-sm mt-1"
                style={{ color: colors.textSecondary }}
              >
                Back to sign in
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

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
          <h2 className="text-2xl font-semibold">Welcome back</h2>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Sign in to continue
          </p>
        </div>
        <SignIn.Root>
          <SignIn.Step name="start">
            <div className="space-y-4 w-[320px]">
              <Clerk.Field name="identifier">
                <Clerk.Label className="block text-sm">Email</Clerk.Label>
                <Clerk.Input
                  type="email"
                  className={inputClass}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIdentifierEntered(e.target.value)}
                  autoComplete="email"
                />
                <Clerk.FieldError className="text-sm text-red-400" />
              </Clerk.Field>

              <Clerk.Field name="password">
                <Clerk.Label className="block text-sm">Password</Clerk.Label>
                <Clerk.Input type="password" className={inputClass} />
                <Clerk.FieldError className="text-sm text-red-400" />
              </Clerk.Field>

              <SignIn.Action
                submit
                className={primaryBtnClass}
                disabled={!identifierEntered}
                style={{
                  backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  color: '#0a0a0a'
                }}
              >
                Sign in
              </SignIn.Action>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="block text-xs mt-2 text-right w-full"
                style={{ color: colors.textSecondary }}
              >
                Forgot password?
              </button>
            </div>
          </SignIn.Step>

          <SignIn.Step name="verifications">
            <SignIn.Strategy name="email_code">
              <div className="space-y-4 w-[320px]">
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  Verification code sent to {identifierEntered || 'your email'}
                </p>
                <Clerk.Field name="code">
                  <Clerk.Label className="block text-sm">Verification code</Clerk.Label>
                  <Clerk.Input className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 tracking-widest text-center text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-indigo-500/60" />
                  <Clerk.FieldError className="text-sm text-red-400" />
                </Clerk.Field>

                <SignIn.Action
                  submit
                  className={primaryBtnClass}
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    color: '#0a0a0a'
                  }}
                >
                  Verify & Continue
                </SignIn.Action>

                <SignIn.Action
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
                </SignIn.Action>
              </div>
            </SignIn.Strategy>
          </SignIn.Step>
        </SignIn.Root>
      </div>
    </div>
  );
}


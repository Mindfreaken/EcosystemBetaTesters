"use client";

import React, { useState } from "react";
import zxcvbn from "zxcvbn";
import { useRouter } from "next/navigation";
import { useSignIn, useSignUp, useClerk } from "@clerk/clerk-react";

export const SignInForm: React.FC<{ redirectUrl?: string }> = ({ redirectUrl = "/home" }) => {
  const router = useRouter();
  const { signIn, isLoaded, setActive } = useSignIn() as any;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setError(null);
    setLoading(true);
    try {
      const res = await signIn.create({ identifier: email, password });
      if (res.status === "complete") {
        await setActive?.({ session: res.createdSessionId });
        router.push(redirectUrl);
      } else {
        setError("Additional steps required. Please use the default UI.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message || err?.message || "Sign in failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 w-[320px]">
      <div className="space-y-2">
        <label htmlFor="signin-email" className="block text-sm">Email</label>
        <input
          id="signin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="signin-password" className="block text-sm">Password</label>
        <input
          id="signin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="••••••••"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-2 font-medium"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
};

export const SignUpForm: React.FC<{
  redirectUrl?: string;
  signInRedirectUrl?: string;
}> = ({ redirectUrl = "/onboarding" }) => {
  const router = useRouter();
  const { signUp, isLoaded, setActive } = useSignUp() as any;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  const getPasswordStrength = (value: string) => {
    if (!value) return { label: "", percent: 0, color: "bg-white/10" };
    const result = zxcvbn(value);
    const score = result.score; // 0 (worst) - 4 (best)

    if (score <= 1) return { label: "Weak", percent: 25, color: "bg-red-500" };
    if (score === 2) return { label: "Fair", percent: 40, color: "bg-orange-500" };
    if (score === 3) return { label: "Good", percent: 65, color: "bg-yellow-400" };
    return { label: "Strong", percent: 100, color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(password);

  const startSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setError(null);
    setLoading(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message || err?.message || "Sign up failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setError(null);
    setLoading(true);
    try {
      const complete = await signUp.attemptEmailAddressVerification({ code });
      if (complete.status === "complete") {
        await setActive?.({ session: complete.createdSessionId });
        router.push(redirectUrl);
      } else {
        setError("Verification incomplete. Try again or use the default UI.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message || err?.message || "Verification failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <form onSubmit={verifyCode} className="space-y-4 w-[320px]">
        <p className="text-sm text-gray-300">We sent a 6-digit code to {email}. Enter it below to verify your email.</p>
        <div className="space-y-2">
          <label htmlFor="verify-code" className="block text-sm">Verification code</label>
          <input
            id="verify-code"
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="123456"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-2 font-medium"
        >
          {loading ? "Verifying..." : "Verify & Continue"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={startSignUp} className="space-y-4 w-[320px]">
      <div className="space-y-2">
        <label htmlFor="signup-email" className="block text-sm">Email</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="signup-password" className="block text-sm">Password</label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Create a strong password"
        />
      </div>
      {strength.label && (
        <div className="space-y-1">
          <div className="mt-1 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full transition-all ${strength.color}`}
              style={{ width: `${strength.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400">Strength: {strength.label}</p>
        </div>
      )}
      <p className="text-xs text-gray-400">
        Use a strong, unique password. Longer phrases with a mix of letters, numbers, and symbols work best. Weak or compromised passwords will be rejected.
      </p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-2 font-medium"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
};



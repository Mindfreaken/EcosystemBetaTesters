"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { ShellLayout } from "@/components/home/shell/shell-layout";
import { Spinner } from "@/components/ui/Spinner";
import Image from "next/image";
import { SuspensionCheck } from "@/components/auth/SuspensionCheck";

export default function Home() {
  return (
    <>
      <AuthLoading>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
          <Image
            src="/achievements/early_adopter_sticker.png"
            alt="Ecosystem early adopter sticker"
            width={160}
            height={160}
            priority
            className="drop-shadow-sm select-none motion-safe:animate-pulse"
          />
          <Spinner size="large" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Checking your session</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">This only takes a moment…</p>
          </div>
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
          <Image
            src="/achievements/early_adopter_sticker.png"
            alt="Ecosystem early adopter sticker"
            width={120}
            height={120}
            priority
            className="drop-shadow-sm select-none"
          />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">You are not signed in.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Redirecting…</p>
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        <SuspensionCheck>
          <ShellLayout />
        </SuspensionCheck>
      </Authenticated>
    </>
  );
}



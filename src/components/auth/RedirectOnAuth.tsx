"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { usePathname, useRouter } from "next/navigation";

export default function RedirectOnAuth({
  home = "/home",
}: {
  home?: string;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const routedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (routedRef.current) return;
    const path = pathname || "/";
    // Only auto-redirect from landing or auth routes
    const onAuthRoute = path === "/" || path.startsWith("/sign-in") || path.startsWith("/sign-up");
    if (onAuthRoute) {
      routedRef.current = true;
      router.replace(home);
    }
  }, [isLoaded, isSignedIn, pathname, router, home]);

  return null;
}



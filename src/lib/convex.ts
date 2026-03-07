"use client";

import { ConvexReactClient } from "convex/react";

let convexInstance: ConvexReactClient | null = null;

export function getConvexClient(): ConvexReactClient | null {
  const isServer = typeof window === "undefined";
  // Use real URL if available; on the server, fall back to a dummy URL to keep Provider context during prerender
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || (isServer ? "http://localhost" : "");
  if (!convexUrl) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("NEXT_PUBLIC_CONVEX_URL is not set; Convex disabled");
    }
    return null; // client-side: no provider
  }

  if (!convexInstance) {
    convexInstance = new ConvexReactClient(convexUrl);
  }

  return convexInstance;
}


"use client";

import Link from "next/link";
import { UiButton } from "@/components/ui/UiButton";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[color:var(--background)] p-4 text-center">
            <h1 className="text-6xl font-bold mb-4" style={{ color: "var(--primary)" }}>404</h1>
            <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
                Oops! The page you're looking for doesn't exist or has been moved.
            </p>
            <Link href="/" passHref legacyBehavior>
                <UiButton variant="primary" size="lg">
                    Go Back Home
                </UiButton>
            </Link>
        </div>
    );
}

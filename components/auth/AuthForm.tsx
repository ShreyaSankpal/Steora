"use client";

import Link from "next/link";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-accent">
        Account
      </p>

      <h1 className="mt-3 font-display text-4xl">
        {isSignup ? "Sign up temporarily paused" : "Login temporarily paused"}
      </h1>

      <p className="mt-3 text-sm text-ink-muted">
        Authentication is temporarily disabled while Steora's core travel
        planning features are being completed. Your account implementation
        has been kept for later.
      </p>

      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover"
      >
        Back to home
      </Link>
    </div>
  );
}

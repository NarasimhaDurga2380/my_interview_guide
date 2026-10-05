"use client";

import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  async function handleSignOut() {
    await authClient.signOut();
    // Full page navigation so /auth/sign-in mounts NeonAuthUIProvider via SSR, not a client-only render.
    window.location.href = "/auth/sign-in";
  }

  return (
    <button type="button" onClick={handleSignOut} className="font-medium text-slate-700 hover:underline">
      Sign out
    </button>
  );
}

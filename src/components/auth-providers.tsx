"use client";

import Link from "next/link";
import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { authClient } from "@/lib/auth/client";

/// Full page navigation (not router.push) so leaving /auth clears the auth-ui theme/CSS side-effects it applies to <html>/<body>.
function fullPageNavigate(url: string) {
  window.location.href = url;
}

export function AuthProviders({ children }: { children: React.ReactNode }) {
  return (
    <NeonAuthUIProvider
      authClient={authClient}
      defaultTheme="light"
      navigate={fullPageNavigate}
      replace={fullPageNavigate}
      Link={Link}
    >
      {children}
    </NeonAuthUIProvider>
  );
}

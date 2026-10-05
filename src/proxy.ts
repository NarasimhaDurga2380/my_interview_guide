import { auth } from "@/lib/auth/server";

/// Next.js 16 renamed middleware.ts to proxy.ts. Every page/API route requires a session; requireAdmin() further gates writes to the "admin" role.
export default auth.middleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: [
    // Everything except the auth pages/API, and static assets.
    "/((?!auth|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};

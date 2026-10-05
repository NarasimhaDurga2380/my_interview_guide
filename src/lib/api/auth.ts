import { auth } from "@/lib/auth/server";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/// Write endpoints require a signed-in session with the "admin" role (Neon Managed Better Auth).
export async function requireAdmin() {
  const { data: session } = await auth.getSession();
  const role = session?.user?.role;
  const roles = Array.isArray(role) ? role : role ? [role] : [];

  if (!session?.user || !roles.includes("admin")) {
    throw new UnauthorizedError();
  }
}

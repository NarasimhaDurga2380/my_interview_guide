import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = await auth.getSession();
  const role = session?.user?.role;
  const roles = Array.isArray(role) ? role : role ? [role] : [];

  if (!session?.user) redirect("/auth/sign-in");
  if (!roles.includes("admin")) redirect("/");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 px-6 py-3 sm:px-10">
        <Link href="/admin/topics" className="text-sm font-semibold text-slate-700">
          Admin
        </Link>
      </header>
      {children}
    </div>
  );
}

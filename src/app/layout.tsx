import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/lib/auth/server";
import { SignOutButton } from "@/components/auth-status";
import { NavControls } from "@/components/nav-controls";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interview Field Guide",
  description: "A static, version-controlled interview preparation library.",
};

// Server Components calling auth.getSession() must be rendered dynamically.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { data: session } = await auth.getSession();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f7f6f2]">
        {session?.user && (
          <div className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-slate-200 bg-[#f7f6f2] px-6 py-2 text-sm text-slate-500 sm:px-10">
            <NavControls />
            <div className="flex items-center gap-4">
              <span>{session.user.email}</span>
              <SignOutButton />
            </div>
          </div>
        )}
        {children}
      </body>
    </html>
  );
}

import { AuthView } from "@neondatabase/auth-ui";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <AuthView pathname="sign-in" />
    </main>
  );
}

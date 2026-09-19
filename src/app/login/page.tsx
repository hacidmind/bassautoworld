import { signIn, auth, requireAdmin } from "@/auth";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { PasswordField } from "@/components/password-field";
export const metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    let authorized = false;
    try {
      await requireAdmin();
      authorized = true;
    } catch {}
    if (authorized) redirect("/admin");
  }
  const { error } = await searchParams;
  return (
    <section className="container section" style={{ maxWidth: 520 }}>
      <p className="eyebrow">BASSAUTOWORLD ADMIN</p>
      <h1 style={{ fontSize: 38 }}>Welcome back.</h1>
      <p>Sign in to manage vehicles, requests, and customer stories.</p>
      <form
        className="form-card"
        action={async (form) => {
          "use server";
          try {
            await signIn("credentials", {
              email: form.get("email"),
              password: form.get("password"),
              redirectTo: "/admin",
            });
          } catch (e) {
            if (e instanceof AuthError) redirect("/login?error=1");
            throw e;
          }
        }}
      >
        <div className="form-grid">
          <label className="field full">
            Email
            <input type="email" name="email" required autoComplete="username" />
          </label>
          <PasswordField />
        </div>
        {error && (
          <p className="error" role="alert">
            Sign-in failed. Check your details and try again.
          </p>
        )}
        <div className="actions">
          <button className="button">Sign in ↗</button>
        </div>
      </form>
    </section>
  );
}

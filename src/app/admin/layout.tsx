import Link from "next/link";
import { auth, requireAdmin, signOut } from "@/auth";
import { redirect } from "next/navigation";
export const metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  try {
    await requireAdmin();
  } catch {
    redirect("/login?error=1");
  }
  return (
    <section className="container section">
      <div className="section-head admin-header">
        <div>
          <p className="eyebrow">BASSAUTOWORLD / ADMIN</p>
          <h2>Your business, in view.</h2>
        </div>
        <form
          className="admin-signout"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="button outline">Sign out</button>
        </form>
      </div>
      <nav className="admin-nav" aria-label="Administration">
        {[
          ["", "Overview"],
          ["vehicles", "Vehicles"],
          ["leads", "Leads"],
          ["inspections", "Inspections"],
          ["preorders", "Preorders"],
          ["service-requests", "Services"],
          ["reviews", "Reviews"],
          ["settings", "Settings"],
        ].map(([path, title]) => (
          <Link key={path} href={"/admin" + (path ? "/" + path : "")}>
            {title}
          </Link>
        ))}
      </nav>
      {children}
    </section>
  );
}

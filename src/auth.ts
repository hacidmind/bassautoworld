import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { User } from "@/lib/models";
import { rateLimit } from "@/lib/security";
import { redirect } from "next/navigation";
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(credentials) {
        const input = z
          .object({ email: z.email(), password: z.string().min(1).max(200) })
          .safeParse(credentials);
        if (!input.success || !process.env.MONGODB_URI) return null;
        await db();
        await rateLimit("login:" + input.data.email.toLowerCase(), 10);
        const user = await User.findOne({
          email: input.data.email.toLowerCase(),
          active: true,
        });
        if (!user || !(await compare(input.data.password, user.passwordHash)))
          return null;
        return { id: String(user._id), email: user.email, name: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.name;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.name = String(token.role || "");
      }
      return session;
    },
  },
});
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await db();
  const user = await User.findOne({
    _id: session.user.id,
    active: true,
    role: { $in: ["ADMIN", "SUPER_ADMIN"] },
  });
  if (!user) throw new Error("Unauthorized");
  return user;
}
export async function requireAdminPage() {
  try {
    return await requireAdmin();
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") redirect("/login");
    throw e;
  }
}

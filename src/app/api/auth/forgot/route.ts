import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { db } from "@/lib/db";
import { User } from "@/lib/models";

const bodySchema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  await db();
  const email = parsed.data.email.toLowerCase();
  const user = await User.findOne({ email, active: true });
  if (!user) return NextResponse.json({ ok: true });
  const token = crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  user.resetToken = hashed;
  user.resetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const link = `${base.replace(/\/$/,"")}/reset/${token}`;
  console.log(`Password reset link for ${email}: ${link}`);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { db } from "@/lib/db";
import { User } from "@/lib/models";
import { hash } from "bcryptjs";

const bodySchema = z.object({ token: z.string().min(1), password: z.string().min(8).max(200) });

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await db();
  const hashed = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const user = await User.findOne({ resetToken: hashed, resetExpires: { $gt: new Date() } });
  if (!user) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  user.passwordHash = await hash(parsed.data.password, 12);
  user.resetToken = undefined;
  user.resetExpires = undefined;
  await user.save();
  return NextResponse.json({ ok: true });
}

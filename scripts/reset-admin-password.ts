import nextEnv from "@next/env";
import mongoose from "mongoose";
import { hash } from "bcryptjs";
import { User } from "../src/lib/models";

nextEnv.loadEnvConfig(process.cwd());

async function main() {
  const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 14)
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 14 characters) in .env.local, alongside MONGODB_URI.");
  await mongoose.connect(MONGODB_URI);
  const user = await User.findOne({ email: ADMIN_EMAIL.trim().toLowerCase(), active: true, role: { $in: ["ADMIN", "SUPER_ADMIN"] } });
  if (!user) throw new Error("No active administrator matches ADMIN_EMAIL; no changes made.");
  user.passwordHash = await hash(ADMIN_PASSWORD, 12);
  user.resetToken = undefined;
  user.resetExpires = undefined;
  await user.save();
  console.log("Admin password reset. Remove ADMIN_PASSWORD from .env.local.");
}

main().catch(() => {
  console.error("Password reset failed. Check the database connection, active ADMIN_EMAIL, and ADMIN_PASSWORD (at least 14 characters). No credentials were printed.");
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());

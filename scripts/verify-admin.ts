import nextEnv from "@next/env";
import mongoose from "mongoose";
import { User } from "../src/lib/models";
nextEnv.loadEnvConfig(process.cwd());
async function main() {
  const { MONGODB_URI, ADMIN_EMAIL } = process.env;
  if (!MONGODB_URI || !ADMIN_EMAIL)
    throw new Error("Set MONGODB_URI and ADMIN_EMAIL in .env.local.");
  await mongoose.connect(MONGODB_URI);
  const email = ADMIN_EMAIL.toLowerCase();
  const user = await User.findOne({ email }).lean();
  if (!user) {
    console.log("No user found with email:", email);
    process.exitCode = 1;
  } else {
    console.log("User found:");
    console.log({ id: String(user._id), email: user.email, role: user.role, active: user.active, passwordHash: user.passwordHash });
  }
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());

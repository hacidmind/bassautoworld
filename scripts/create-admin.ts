import nextEnv from "@next/env";
import mongoose from "mongoose";
import { hash } from "bcryptjs";
import { User } from "../src/lib/models";
import { configureMongoDns } from "../src/lib/mongo-dns";
nextEnv.loadEnvConfig(process.cwd());
async function main() {
  const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (
    !MONGODB_URI ||
    !ADMIN_EMAIL ||
    !ADMIN_PASSWORD ||
    ADMIN_PASSWORD.length < 14
  )
    throw new Error(
      "Set MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD (at least 14 characters) in .env.local.",
    );
  configureMongoDns();
  await mongoose.connect(MONGODB_URI);
  const email = ADMIN_EMAIL.toLowerCase();
  if (await User.exists({ email }))
    throw new Error("This admin already exists; no changes made.");
  await User.create({
    email,
    passwordHash: await hash(ADMIN_PASSWORD, 12),
    role: "SUPER_ADMIN",
    active: true,
  });
  console.log(
    "Administrator created. Remove ADMIN_PASSWORD from your environment.",
  );
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());

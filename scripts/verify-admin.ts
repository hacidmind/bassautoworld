import nextEnv from "@next/env";
import mongoose from "mongoose";
import { User } from "../src/lib/models";
import { configureMongoDns } from "../src/lib/mongo-dns";
nextEnv.loadEnvConfig(process.cwd());
async function main() {
  const { MONGODB_URI, ADMIN_EMAIL } = process.env;
  if (!MONGODB_URI || !ADMIN_EMAIL)
    throw new Error("Set MONGODB_URI and ADMIN_EMAIL in .env.local.");
  configureMongoDns();
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000, autoIndex: false, autoCreate: false });
  const email = ADMIN_EMAIL.toLowerCase();
  const user = await User.findOne({ email }).lean();
  if (!user) {
    console.log("No user found with email:", email);
    process.exitCode = 1;
  } else {
    console.log("User found:");
    console.log({ role: user.role, active: user.active });
  }
}
main()
  .catch((e) => {
    console.error("Administrator verification failed:", e.name, e.code || "");
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());

// Isolated, disposable integration environment. Never points at Atlas.
import { MongoMemoryReplSet } from "mongodb-memory-server-core";
import mongoose from "mongoose";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { spawn } from "child_process";
import { User } from "../src/lib/models";
const replica = await MongoMemoryReplSet.create({
  replSet: { count: 1 },
  instanceOpts: [{ port: 27028 }],
});
const uri = replica.getUri("bassautoworld_qa");
await mongoose.connect(uri);
await User.create({
  email: "qa@example.test",
  passwordHash: await hash("Local-QA-only-2026!", 12),
  role: "SUPER_ADMIN",
  active: true,
});
await mongoose.disconnect();
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--port", "3001", "--hostname", "127.0.0.1"],
  {
    stdio: "inherit",
    windowsHide: true,
    env: {
      ...process.env,
      MONGODB_URI: uri,
      AUTH_SECRET: randomBytes(32).toString("hex"),
      AUTH_TRUST_HOST: 'true',
      NEXT_PUBLIC_SITE_URL: "http://localhost:3001",
      CLOUDINARY_CLOUD_NAME: "",
      CLOUDINARY_API_KEY: "",
      CLOUDINARY_API_SECRET: "",
    },
  },
);
async function stop() {
  child.kill();
  await replica.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
child.on("exit", async () => {
  await replica.stop();
  process.exit(0);
});

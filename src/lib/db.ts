import mongoose from "mongoose";
import { lookup } from "node:dns/promises";

export async function canReachMongo(uri?: string): Promise<boolean> {
  if (!uri) return false;
  try {
    const parsed = new URL(uri);
    const hostname = parsed.hostname;
    if (!hostname) return false;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1"
    )
      return true;
    await lookup(hostname, { verbatim: true });
    return true;
  } catch {
    return false;
  }
}

let connection: Promise<typeof mongoose> | undefined;
export async function db() {
  if (!process.env.MONGODB_URI)
    throw new Error("Database is not configured. Please try again later.");

  if (!(await canReachMongo(process.env.MONGODB_URI))) {
    throw new Error(
      "MongoDB host is not reachable from this environment. Check MONGODB_URI and network access.",
    );
  }

  connection ??= mongoose
    .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .catch((e) => {
      console.error("MongoDB connection failed:", e);
      connection = undefined;
      throw e;
    });
  return connection;
}

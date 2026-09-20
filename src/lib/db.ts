import mongoose from "mongoose";
import { configureMongoDns } from "./mongo-dns";

let connection: Promise<typeof mongoose> | undefined;
export async function db() {
  if (!process.env.MONGODB_URI)
    throw new Error("Database is not configured. Please try again later.");

  // Let the driver resolve SRV records and replica-set hosts. An address
  // lookup of an SRV seed hostname can fail even when the cluster is healthy.
  if (!connection) configureMongoDns();
  connection ??= mongoose
    .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .catch((e) => {
      console.error("MongoDB connection failed:", {
        name: e instanceof Error ? e.name : "UnknownError",
        code:
          typeof e?.code === "number" || typeof e?.code === "string"
            ? e.code
            : undefined,
      });
      connection = undefined;
      throw e;
    });
  return connection;
}

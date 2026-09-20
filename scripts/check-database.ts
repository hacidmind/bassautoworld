import nextEnv from "@next/env";
import mongoose from "mongoose";
import { configureMongoDns } from "../src/lib/mongo-dns";
nextEnv.loadEnvConfig(process.cwd());
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not configured.");
  process.exitCode = 1;
} else {
  configureMongoDns();
  const connection = mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 10000,
    autoIndex: false,
    autoCreate: false,
  });
  try {
    await connection.asPromise();
    await connection.db!.command({ ping: 1 });
    console.log("MongoDB connection and ping succeeded.");
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error instanceof Error ? error.name : "Unknown error",
      error && typeof error === "object" && "code" in error ? error.code : "",
    );
    process.exitCode = 1;
  } finally {
    await connection.close();
  }
}

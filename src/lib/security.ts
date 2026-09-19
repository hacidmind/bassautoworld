import { createHash } from "crypto";
import { db } from "./db";
import { RateLimit } from "./models";
export async function rateLimit(key: string, max = 8) {
  await db();
  const bucket = Math.floor(Date.now() / 600000);
  const id = createHash("sha256")
    .update(key + bucket)
    .digest("hex");
  const row = await RateLimit.findOneAndUpdate(
    { _id: id },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date((bucket + 2) * 600000) },
    },
    { upsert: true, returnDocument: "after" },
  );
  if (row.count > max)
    throw new Error("Too many requests. Please try again in 10 minutes.");
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin || origin !== new URL(req.url).origin)
    throw new Error("Invalid request origin");
}
export async function body(req: Request) {
  if (Number(req.headers.get("content-length") || 0) > 100000)
    throw new Error("Request too large");
  const raw = await req.text();
  if (raw.length > 100000) throw new Error("Request too large");
  return JSON.parse(raw);
}

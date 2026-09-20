import { test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { db } from "../src/lib/db";

test("database delegates SRV discovery to the driver and retries failed connections", async (t) => {
  const originalUri = process.env.MONGODB_URI;
  t.after(() => {
    if (originalUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = originalUri;
  });
  delete process.env.MONGODB_URI;
  await assert.rejects(db(), /Database is not configured/);

  // This seed deliberately has no address record: resolving it is the
  // driver's responsibility, not a prerequisite imposed by the app.
  process.env.MONGODB_URI = "mongodb+srv://cluster.example.invalid/app";
  const unavailable = new Error("temporarily unavailable");
  const connect = t.mock.method(mongoose, "connect", async () => {
    throw unavailable;
  });
  t.mock.method(console, "error", () => {});
  await assert.rejects(db(), (error) => error === unavailable);
  assert.equal(connect.mock.callCount(), 1);
  assert.equal(connect.mock.calls[0].arguments[0], process.env.MONGODB_URI);

  connect.mock.mockImplementation(async () => mongoose);
  const connections = await Promise.all([db(), db()]);
  assert.deepEqual(connections, [mongoose, mongoose]);
  assert.equal(connect.mock.callCount(), 2);
});

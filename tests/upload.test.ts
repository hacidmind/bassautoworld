import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseImageUrls,
  runUploadBatch,
  uploadPhoto,
} from "../src/lib/upload-client";
import { allowedImageFormats } from "../src/lib/image-formats";

test("AVIF files and URL imports retain their image metadata", async (t) => {
  assert.ok(allowedImageFormats.split(",").includes("avif"));
  const uploaded: FormData[] = [];
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (url === "/api/uploads")
      return Response.json({
        params: { allowed_formats: allowedImageFormats },
        cloudName: "demo",
        apiKey: "test",
        signature: "test",
      });
    uploaded.push(init.body as FormData);
    return Response.json({
      public_id: "vehicle/avif",
      secure_url: "https://res.cloudinary.com/demo/image/upload/vehicle.avif",
      width: 800,
      height: 600,
      format: "avif",
    });
  });
  for (const source of [
    new File(["fixture"], "photo.avif", { type: "image/avif" }),
    new File(["fixture"], "photo.AVIF"),
    "https://example.com/photo.avif",
  ]) {
    const image = await uploadPhoto(source, false);
    assert.equal(image.format, "avif");
    assert.equal(image.width, 800);
    assert.ok(image.secureUrl.endsWith(".avif"));
  }
  assert.equal(uploaded.length, 3);
  assert.equal(uploaded[2].get("file"), "https://example.com/photo.avif");
});

test("URL batches remove duplicates and preserve query-string commas", () => {
  assert.deepEqual(
    parseImageUrls(
      "https://example.com/a?size=1,2\n https://example.com/b\nhttps://example.com/b",
    ),
    ["https://example.com/a?size=1,2", "https://example.com/b"],
  );
});

test("batch keeps running after failure and limits concurrency to three", async () => {
  let active = 0,
    peak = 0;
  const results: PromiseSettledResult<number>[] = [];
  await runUploadBatch(
    [0, 1, 2, 3, 4],
    async (n) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      if (n === 1) throw new Error("unavailable");
      return n;
    },
    (index, result) => {
      results[index] = result;
    },
  );
  assert.equal(peak, 3);
  assert.equal(results.length, 5);
  assert.equal(results[1].status, "rejected");
  assert.deepEqual(results[4], { status: "fulfilled", value: 4 });
});

test("invalid URL schemes and credential-bearing links are rejected before uploading", async () => {
  await assert.rejects(uploadPhoto("file:///photo.jpg", false), /public HTTP/);
  await assert.rejects(
    uploadPhoto("https://user:pass@example.com/a.jpg", false),
    /public HTTP/,
  );
});

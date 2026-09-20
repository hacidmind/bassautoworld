import { test } from "node:test";
import assert from "node:assert/strict";
import { siteUrl } from "../src/lib/site-url";

test("production metadata never uses a local or insecure URL", () => {
  for (const url of ["http://localhost:3000", "https://127.0.0.1", "invalid", "http://example.com"]) {
    assert.equal(siteUrl({ VERCEL: "1", NEXT_PUBLIC_SITE_URL: url, VERCEL_PROJECT_PRODUCTION_URL: "bassautoworld.vercel.app" }), "https://bassautoworld.vercel.app");
  }
});
test("custom domains are retained and development URLs remain usable", () => {
  assert.equal(siteUrl({ VERCEL: "1", NEXT_PUBLIC_SITE_URL: "https://example.com/" }), "https://example.com");
  assert.equal(siteUrl({ NEXT_PUBLIC_SITE_URL: "http://localhost:3001" }), "http://localhost:3001");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { sameOrigin } from "../src/lib/security";

test("origin validation accepts the browser hostname when Next rewrites its internal URL", () => {
  assert.doesNotThrow(() => sameOrigin(new Request("http://localhost:3107/api/requests", {
    headers: { host: "127.0.0.1:3107", origin: "http://127.0.0.1:3107" },
  })));
});

test("origin validation rejects cross-origin requests and untrusted forwarded hosts", () => {
  for (const origin of ["https://attacker.example", "http://bassautoworld.vercel.app", "null", ""]) {
    assert.throws(() => sameOrigin(new Request("https://bassautoworld.vercel.app/api/requests", {
      headers: { host: "bassautoworld.vercel.app", origin, "x-forwarded-host": "attacker.example" },
    })), /Invalid request origin/);
  }
  assert.doesNotThrow(() => sameOrigin(new Request("https://bassautoworld.vercel.app/api/requests", {
    headers: { origin: "https://bassautoworld.vercel.app" },
  })));
});

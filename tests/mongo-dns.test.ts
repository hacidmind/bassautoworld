import { test } from "node:test";
import assert from "node:assert/strict";
import dns from "node:dns/promises";
import { configureMongoDns } from "../src/lib/mongo-dns";

test("DNS override is optional and applied only once", (t) => {
  const original = process.env.MONGODB_DNS_SERVERS;
  t.after(() => {
    if (original === undefined) delete process.env.MONGODB_DNS_SERVERS;
    else process.env.MONGODB_DNS_SERVERS = original;
  });
  const setServers = t.mock.method(dns, "setServers", () => {});
  delete process.env.MONGODB_DNS_SERVERS;
  configureMongoDns();
  assert.equal(setServers.mock.callCount(), 0);
  process.env.MONGODB_DNS_SERVERS = " 1.1.1.1, 8.8.8.8, ";
  configureMongoDns();
  configureMongoDns();
  assert.equal(setServers.mock.callCount(), 1);
  assert.deepEqual(setServers.mock.calls[0].arguments, [["1.1.1.1", "8.8.8.8"]]);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { POST as forgot } from "../src/app/api/auth/forgot/route";
import { POST as reset } from "../src/app/api/auth/reset/route";

test("unfinished public recovery cannot create or redeem reset tokens", async () => {
  for (const handler of [forgot, reset]) {
    const response = await handler();
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: "Password recovery is unavailable. Contact the site administrator.",
    });
  }
});

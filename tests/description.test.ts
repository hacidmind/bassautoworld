import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanDescription, descriptionText } from "../src/lib/description";

test("description preserves supported formatting and strips executable HTML", () => {
  const result = cleanDescription(
    '<h2 onclick="alert(1)">Highlights</h2><p><strong>Bold</strong> <u>underline</u></p><blockquote>Inspected</blockquote><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">text</a>',
  );
  assert.equal(
    result,
    "<h2>Highlights</h2><p><strong>Bold</strong> <u>underline</u></p><blockquote>Inspected</blockquote>text",
  );
});

test("plain description decodes entities and separates blocks for cards and metadata", () => {
  assert.equal(
    descriptionText(
      "<h2>Comfort &amp; style</h2><p>One<br>Two</p><ul><li>Leather</li><li>AC</li></ul>",
    ),
    "Comfort & style\nOne\nTwo\nLeather\nAC",
  );
});

test("empty or hostile formatting produces no public description text", () => {
  assert.equal(
    descriptionText("<p><br></p><script>bad()</script><style>body{}</style>"),
    "",
  );
});

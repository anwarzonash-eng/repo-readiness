import { test } from "node:test";
import assert from "node:assert/strict";
import { scanText } from "./secrets.js";

// Fake values assembled at runtime so this file does not itself look like a leak.
const fakeAws = "AK" + "IA" + "ABCDEFGHIJKLMNOP";
const fakeGh = "ghp_" + "a".repeat(36);

test("finds an AWS key id and reports the line", () => {
  const f = scanText(`const a = 1;\nconst k = "${fakeAws}";`, "x.ts");
  assert.equal(f.length, 1);
  assert.equal(f[0].line, 2);
  assert.match(f[0].message, /AWS/);
});

test("finds a GitHub token", () => {
  assert.equal(scanText(`token=${fakeGh}`, "x.env").length, 1);
});

test("finds a db url with credentials but not a bare host url", () => {
  assert.equal(scanText("postgres" + "://user:pw@localhost:5432/db", "a").length, 1);
  assert.equal(scanText("postgres://localhost:5432/db", "a").length, 0);
});

test("ignores ordinary code", () => {
  assert.equal(scanText("const total = items.reduce((a, b) => a + b, 0);", "a.ts").length, 0);
});

test("a line with the ignore marker is skipped", () => {
  assert.equal(scanText(`const k = "${fakeAws}"; // repo-readiness-ignore`, "a.ts").length, 0);
});

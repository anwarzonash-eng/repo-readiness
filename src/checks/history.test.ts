import { test } from "node:test";
import assert from "node:assert/strict";
import { scanDiffText } from "./history.js";

const fakeAws = "AK" + "IA" + "ABCDEFGHIJKLMNOP";

const diff = [
  "commit:abc1234",
  "diff --git a/config.js b/config.js",
  "+++ b/config.js",
  "@@ -0,0 +1 @@",
  `+const key = "${fakeAws}";`,
  "commit:def5678",
  "diff --git a/config.js b/config.js",
  "+++ b/config.js",
  "@@ -1 +0,0 @@",
  `-const key = "${fakeAws}";`,
].join("\n");

test("reports a secret that was added and later removed", () => {
  const f = scanDiffText(diff);
  assert.equal(f.length, 1);
  assert.match(f[0].message, /abc1234/);
  assert.equal(f[0].file, "config.js");
});

test("does not report removed lines", () => {
  const removedOnly = diff.split("\n").slice(5).join("\n");
  assert.equal(scanDiffText(removedOnly).length, 0);
});

test("same secret in one commit is reported once", () => {
  const twice = diff.replace("+const key", `+const a = "${fakeAws}";\n+const key`);
  assert.equal(scanDiffText(twice).length, 1);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { findPhones } from "./phones.js";

// Numbers are written with dots and assembled at runtime so this file does
// not contain anything that looks like a real phone number.
const num = (s: string) => s.replace(/\./g, "");

test("flags international and US numbers", () => {
  assert.equal(findPhones(`call ${num("+4.9 15.1 23.45 67.89")} now`, "a.md").length, 1);
  assert.equal(findPhones(`tel: ${num("(2.12) 4.56-78.90")}`, "a.md").length, 1);
});

test("allows fictional ranges", () => {
  assert.equal(findPhones("+44 7700 900123", "a.md").length, 0);
  assert.equal(findPhones("(212) 555-0142", "a.md").length, 0);
});

test("does not flag versions, ids and dates", () => {
  const text = "v1.2.3 build 20261019 id 123456789012 2026-10-19 port 3000";
  assert.equal(findPhones(text, "a.md").length, 0);
});

test("reports the line number and respects the ignore marker", () => {
  const phone = num("+.1 3.03 4.56 78.90");
  const f = findPhones(`ok\ncall ${phone}\nok`, "a");
  assert.equal(f[0].line, 2);
  assert.equal(findPhones(`call ${phone} repo-readiness-ignore`, "a").length, 0);
});

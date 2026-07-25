import { test } from "node:test";
import assert from "node:assert/strict";
import { findEmails } from "./emails.js";

// Addresses are assembled at runtime so this file does not trip its own scan.
const at = "@";

test("flags an email on a real-looking domain", () => {
  const f = findEmails(`contact: alice${at}somecompany.io`, "a.md");
  assert.equal(f.length, 1);
  assert.equal(f[0].severity, "warn");
  assert.equal(f[0].line, 1);
});

test("allows example and noreply domains", () => {
  const text = "a@example.com\nb@example.org\n123+name@users.noreply.github.com";
  assert.equal(findEmails(text, "a.md").length, 0);
});

test("finds several addresses on separate lines", () => {
  assert.equal(findEmails(`x${at}a.dev\nno email here\ny${at}b.dev`, "a").length, 2);
});

test("ignores @ mentions and decorators", () => {
  assert.equal(findEmails("@Component({}) and @user said hi", "a.ts").length, 0);
});

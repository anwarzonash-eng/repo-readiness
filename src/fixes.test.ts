import { test } from "node:test";
import assert from "node:assert/strict";
import { formatSuggestions, suggestFixes } from "./fixes.js";
import type { Finding } from "./types.js";

const f = (check: string, extra: Partial<Finding> = {}): Finding => ({
  check,
  severity: "error",
  message: "x",
  ...extra,
});

test("tracked env file gets rm --cached and a gitignore line", () => {
  const s = suggestFixes([f("env", { file: "api/.env.production" })]);
  assert.deepEqual(s, ["git rm --cached api/.env.production", "echo .env.production >> .gitignore"]);
});

test("suggestions are de-duplicated", () => {
  const s = suggestFixes([f("secrets"), f("history"), f("secrets")]);
  assert.equal(s.length, 2);
});

test("missing files map to specific advice", () => {
  const s = suggestFixes([f("files", { message: "Missing LICENSE file in the top folder" })]);
  assert.match(s[0], /LICENSE/);
});

test("no findings means no section", () => {
  assert.equal(formatSuggestions([]), "");
  assert.match(formatSuggestions([f("env", { file: ".env" })]), /Suggested fixes/);
});

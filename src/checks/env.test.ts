import { test } from "node:test";
import assert from "node:assert/strict";
import { checkTrackedEnvFiles } from "./env.js";

test("flags a tracked .env", () => {
  const f = checkTrackedEnvFiles(["src/a.ts", ".env"]);
  assert.equal(f[0].severity, "error");
  assert.equal(f[0].file, ".env");
});

test("flags nested and suffixed env files", () => {
  const f = checkTrackedEnvFiles(["api/.env.production", "web/.env.local"]);
  assert.equal(f.filter((x) => x.severity === "error").length, 2);
});

test("allows .env.example", () => {
  assert.equal(checkTrackedEnvFiles([".env.example", "a.ts"]).length, 0);
});

test("does not match lookalike names", () => {
  assert.equal(checkTrackedEnvFiles(["src/environment.ts", "env.md"]).length, 0);
});

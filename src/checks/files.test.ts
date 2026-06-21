import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkRequiredFiles } from "./files.js";

function tmp(files: string[]): string {
  const dir = mkdtempSync(join(tmpdir(), "rr-"));
  for (const f of files) writeFileSync(join(dir, f), "x");
  return dir;
}

test("reports every missing file in an empty folder", () => {
  const dir = tmp([]);
  const findings = checkRequiredFiles(dir);
  rmSync(dir, { recursive: true });
  const messages = findings.map((f) => f.message).join("|");
  assert.match(messages, /README/);
  assert.match(messages, /LICENSE/);
  assert.match(messages, /ROADMAP/);
  assert.match(messages, /\.gitignore/);
});

test("passes when all files exist, case-insensitive", () => {
  const dir = tmp(["readme.md", "LICENSE", "Roadmap.md", ".gitignore"]);
  const findings = checkRequiredFiles(dir);
  rmSync(dir, { recursive: true });
  assert.equal(findings.length, 0);
});

test("reports a nonexistent path", () => {
  const findings = checkRequiredFiles(join(tmpdir(), "does-not-exist-rr"));
  assert.equal(findings[0].severity, "error");
});

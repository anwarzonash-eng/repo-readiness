import { test } from "node:test";
import assert from "node:assert/strict";
import { exitCode, formatJson, formatText } from "./report.js";
import type { Finding } from "./types.js";

const err: Finding = { check: "secrets", severity: "error", message: "Possible token", file: "a.ts", line: 3 };
const warn: Finding = { check: "files", severity: "warn", message: "Missing ROADMAP file" };

test("text output lists errors before warnings with a summary", () => {
  const out = formatText([warn, err]);
  assert.ok(out.indexOf("ERROR") < out.indexOf("WARN"));
  assert.match(out, /a\.ts:3/);
  assert.match(out, /1 error\(s\), 1 warning\(s\), 0 note\(s\)/);
});

test("clean run prints a pass message", () => {
  assert.equal(formatText([]), "All checks passed.\n");
});

test("exit code is 1 only when there is an error", () => {
  assert.equal(exitCode([warn]), 0);
  assert.equal(exitCode([warn, err]), 1);
});

test("json output has ok flag", () => {
  assert.equal(JSON.parse(formatJson([err])).ok, false);
  assert.equal(JSON.parse(formatJson([warn])).ok, true);
});

test("quiet mode hides warnings but keeps the totals", () => {
  const out = formatText([warn, err], { quiet: true });
  assert.ok(!out.includes("WARN"));
  assert.match(out, /1 warning\(s\)/);
});

test("color adds ANSI codes only when asked", () => {
  assert.ok(formatText([err], { color: true }).includes("[31m"));
  assert.ok(!formatText([err]).includes("["));
});

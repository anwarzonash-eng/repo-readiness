import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runChecks } from "./run.js";

function repo(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "rr-repo-"));
  const git = (...args: string[]) => execFileSync("git", args, { cwd: dir, stdio: "ignore" });
  git("init", "-q");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "Test");
  for (const [name, body] of Object.entries(files)) {
    const full = join(dir, name);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, body);
  }
  git("add", "-A");
  git("commit", "-q", "-m", "init");
  return dir;
}

test("a tidy repo has no errors", () => {
  const dir = repo({ "README.md": "# x", LICENSE: "MIT", "ROADMAP.md": "- [ ] a", ".gitignore": ".env\n" });
  const f = runChecks(dir);
  rmSync(dir, { recursive: true, force: true });
  assert.equal(f.filter((x) => x.severity === "error").length, 0);
});

test("reports a tracked .env and a missing license", () => {
  const dir = repo({ "README.md": "# x", ".env": "A=1" });
  const f = runChecks(dir);
  rmSync(dir, { recursive: true, force: true });
  const text = f.map((x) => x.message).join("|");
  assert.match(text, /Env file is tracked/);
  assert.match(text, /Missing LICENSE/);
});

test("--history finds a secret that was later deleted", () => {
  const key = "AK" + "IA" + "ABCDEFGHIJKLMNOP";
  const dir = repo({ "README.md": "# x", LICENSE: "MIT", "app.js": `const k = "${key}";\n` });
  execFileSync("git", ["rm", "-q", "app.js"], { cwd: dir });
  execFileSync("git", ["commit", "-q", "-m", "remove"], { cwd: dir, stdio: "ignore" });
  const plain = runChecks(dir);
  const withHistory = runChecks(dir, { history: true });
  rmSync(dir, { recursive: true, force: true });
  assert.equal(plain.some((x) => x.check === "history"), false);
  assert.equal(withHistory.some((x) => x.check === "history"), true);
});

test("a folder that is not a repo is an error", () => {
  const dir = mkdtempSync(join(tmpdir(), "rr-plain-"));
  const f = runChecks(dir);
  rmSync(dir, { recursive: true, force: true });
  assert.ok(f.some((x) => x.message === "Not a git repository"));
});

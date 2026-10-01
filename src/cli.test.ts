import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "cli.js");

function run(args: string[]) {
  const r = spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8" });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

function tidyRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "rr-cli-"));
  for (const [name, body] of Object.entries({
    "README.md": "# x",
    LICENSE: 'Permission is hereby granted, free of charge\nTHE SOFTWARE IS PROVIDED "AS IS"',
    "ROADMAP.md": "- [ ] a",
    ".gitignore": "node_modules/\n",
  })) {
    writeFileSync(join(dir, name), body);
  }
  const git = (...a: string[]) => execFileSync("git", a, { cwd: dir, stdio: "ignore" });
  git("init", "-q");
  git("config", "user.email", "t@example.com");
  git("config", "user.name", "T");
  git("add", "-A");
  git("commit", "-q", "-m", "init");
  return dir;
}

test("--version and --help exit 0", () => {
  assert.match(run(["--version"]).out, /^\d+\.\d+\.\d+/);
  const help = run(["--help"]);
  assert.equal(help.code, 0);
  assert.match(help.out, /--history/);
});

test("a tidy repo passes with exit 0", () => {
  const dir = tidyRepo();
  const r = run([dir, "--no-color"]);
  rmSync(dir, { recursive: true, force: true });
  assert.equal(r.code, 0);
  assert.match(r.out, /All checks passed/);
});

test("errors give exit 1 and json output is parseable", () => {
  const dir = mkdtempSync(join(tmpdir(), "rr-cli-empty-"));
  const r = run([dir, "--json"]);
  rmSync(dir, { recursive: true, force: true });
  assert.equal(r.code, 1);
  assert.equal(JSON.parse(r.out).ok, false);
});

test("sarif output is valid json with a version", () => {
  const dir = tidyRepo();
  const r = run([dir, "--format", "sarif"]);
  rmSync(dir, { recursive: true, force: true });
  assert.equal(JSON.parse(r.out).version, "2.1.0");
});

test("bad options exit 2 with a message on stderr", () => {
  const bad = run(["--format", "xml"]);
  assert.equal(bad.code, 2);
  assert.match(bad.err, /unknown format/);
  assert.equal(run(["--nope"]).code, 2);
  assert.equal(run(["a", "b"]).code, 2);
});

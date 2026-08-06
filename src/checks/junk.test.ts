import { test } from "node:test";
import assert from "node:assert/strict";
import { checkJunk } from "./junk.js";

const noSize = () => null;

test("flags dependency folders, build output and logs", () => {
  const f = checkJunk(["node_modules/a/index.js", "web/dist/app.js", "run.log", "src/a.ts"], noSize, 1e9);
  assert.deepEqual(f.map((x) => x.file), ["node_modules/a/index.js", "web/dist/app.js", "run.log"]);
});

test("flags database and OS files", () => {
  const f = checkJunk(["data/app.sqlite", ".DS_Store", "docs/Thumbs.db"], noSize, 1e9);
  assert.equal(f.length, 3);
});

test("flags files over the size limit only", () => {
  const sizes: Record<string, number> = { "a.bin": 6 * 1024 * 1024, "b.txt": 100 };
  const f = checkJunk(["a.bin", "b.txt"], (x) => sizes[x] ?? null, 5 * 1024 * 1024);
  assert.equal(f.length, 1);
  assert.match(f[0].message, /6\.0 MB/);
});

test("lookalike folder names are fine", () => {
  assert.equal(checkJunk(["src/distance.ts", "builder/a.ts"], noSize, 1e9).length, 0);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { ConfigError, DEFAULT_CONFIG, makeIgnore, parseConfig } from "./config.js";

test("empty object gives defaults", () => {
  assert.deepEqual(parseConfig("{}"), DEFAULT_CONFIG);
});

test("reads all options", () => {
  const c = parseConfig('{"ignorePaths":["docs/"],"disable":["env"],"maxFileSizeMB":2}');
  assert.deepEqual(c, { ignorePaths: ["docs/"], disable: ["env"], maxFileSizeMB: 2 });
});

test("rejects bad json, wrong types and unknown keys", () => {
  assert.throws(() => parseConfig("{nope"), ConfigError);
  assert.throws(() => parseConfig('{"disable":"env"}'), ConfigError);
  assert.throws(() => parseConfig('{"maxFileSizeMB":-1}'), ConfigError);
  assert.throws(() => parseConfig('{"colour":true}'), /Unknown option/);
});

test("glob: folder, extension and nested patterns", () => {
  const ignored = makeIgnore(["fixtures/", "*.min.js", "src/**/gen.ts"]);
  assert.equal(ignored("fixtures/a/b.txt"), true);
  assert.equal(ignored("web/app.min.js"), true);
  assert.equal(ignored("src/x/y/gen.ts"), true);
  assert.equal(ignored("src/gen.ts"), true);
  assert.equal(ignored("src/main.ts"), false);
  assert.equal(ignored("other/fixtures.txt"), false);
});

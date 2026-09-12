import { test } from "node:test";
import assert from "node:assert/strict";
import { entropy, findHighEntropyAssignments } from "./entropy.js";

test("entropy grows with variety", () => {
  assert.equal(entropy(""), 0);
  assert.equal(entropy("aaaaaaaa"), 0);
  assert.ok(entropy("abcdefgh") > 2.9);
  assert.ok(entropy("a8Fk29xQpL0zVb3N") > 3.5);
});

// Random-looking values are assembled at runtime so this file passes its own scan.
const random1 = "q8Zr2L" + "mX9vB4tYw7NcP1";
const random2 = "Xk29Lm" + "Qp7vRt4ZaB8cWn";

test("flags a random-looking secret assignment", () => {
  const f = findHighEntropyAssignments(`const apiKey = "${random1}";`, "a.ts");
  assert.equal(f.length, 1);
  assert.equal(f[0].line, 1);
});

test("flags yaml / env style too", () => {
  assert.equal(findHighEntropyAssignments(`db_password: "${random2}"`, "a.yml").length, 1);
});

test("ignores placeholders and env lookups", () => {
  const text = [
    `token = "your-token-goes-here-123"`,
    `secret = process.env.SECRET_VALUE_LONG_ENOUGH`,
    `password = "change-me-to-something-long"`,
    `api_key = "<paste-key-here-please>"`,
  ].join("\n");
  assert.equal(findHighEntropyAssignments(text, "a").length, 0);
});

test("ignores low-entropy and short values", () => {
  const text = `password = "aaaaaaaaaaaaaaaaaaaa"\ntoken = "short"`;
  assert.equal(findHighEntropyAssignments(text, "a").length, 0);
});

test("respects the ignore marker", () => {
  const line = `const secret = "${random1}"; // repo-readiness-ignore`;
  assert.equal(findHighEntropyAssignments(line, "a.ts").length, 0);
});

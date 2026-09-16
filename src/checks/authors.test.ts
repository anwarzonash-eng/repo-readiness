import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeAuthors, parseAuthorLines } from "./authors.js";

test("counts commits per identity and sorts by activity", () => {
  const ids = parseAuthorLines(["Ann|ann@example.com", "Ann|ANN@example.com", "Bob|bob@example.com"]);
  assert.equal(ids[0].commits, 2);
  assert.equal(ids[0].email, "ann@example.com");
  assert.equal(ids.length, 2);
});

test("a single clean identity gives no findings", () => {
  assert.deepEqual(analyzeAuthors(parseAuthorLines(["Ann|ann@example.com", "Ann|ann@example.com"])), []);
});

test("placeholder emails are warned about", () => {
  const f = analyzeAuthors(parseAuthorLines(["Ann|ann@localhost", "Bob|root@example.com"]));
  assert.equal(f.filter((x) => x.severity === "warn").length, 2);
});

test("several author emails produce a mailmap hint, noreply is ignored", () => {
  const f = analyzeAuthors(
    parseAuthorLines(["Ann|ann@example.com", "Ann|ann@example.org", "Ann|1+ann@users.noreply.github.com"]),
  );
  assert.equal(f.length, 1);
  assert.match(f[0].message, /2 different author emails/);
});

test("one email under two names is reported", () => {
  const f = analyzeAuthors(parseAuthorLines(["Ann|ann@example.com", "A. Smith|ann@example.com"]));
  assert.ok(f.some((x) => /2 names/.test(x.message)));
});

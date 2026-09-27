import { test } from "node:test";
import assert from "node:assert/strict";
import { formatSarif } from "./sarif.js";

test("maps severities, locations and rules", () => {
  const log = JSON.parse(
    formatSarif(
      [
        { check: "secrets", severity: "error", message: "key", file: "a.ts", line: 4 },
        { check: "files", severity: "warn", message: "no roadmap" },
        { check: "authors", severity: "info", message: "hint" },
      ],
      "9.9.9",
    ),
  );
  const run = log.runs[0];
  assert.equal(log.version, "2.1.0");
  assert.equal(run.tool.driver.version, "9.9.9");
  assert.deepEqual(run.results.map((r: { level: string }) => r.level), ["error", "warning", "note"]);
  assert.equal(run.results[0].locations[0].physicalLocation.region.startLine, 4);
  assert.deepEqual(run.results[1].locations, []);
  assert.equal(run.tool.driver.rules.length, 3);
});

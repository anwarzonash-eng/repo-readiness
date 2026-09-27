import type { Finding, Severity } from "./types.js";

const LEVEL: Record<Severity, "error" | "warning" | "note"> = {
  error: "error",
  warn: "warning",
  info: "note",
};

/** Minimal SARIF 2.1.0 log so results can be shown in code-scanning dashboards. */
export function formatSarif(findings: Finding[], version: string): string {
  const rules = [...new Set(findings.map((f) => f.check))].map((id) => ({ id, name: id }));
  const results = findings.map((f) => ({
    ruleId: f.check,
    level: LEVEL[f.severity],
    message: { text: f.message },
    locations: f.file
      ? [
          {
            physicalLocation: {
              artifactLocation: { uri: f.file },
              ...(f.line ? { region: { startLine: f.line } } : {}),
            },
          },
        ]
      : [],
  }));
  const log = {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [{ tool: { driver: { name: "repo-readiness", version, rules } }, results }],
  };
  return JSON.stringify(log, null, 2) + "\n";
}

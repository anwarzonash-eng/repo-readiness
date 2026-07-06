import type { Finding } from "./types.js";

const ORDER = { error: 0, warn: 1, info: 2 } as const;

export function formatText(findings: Finding[]): string {
  if (findings.length === 0) return "All checks passed.\n";
  const sorted = [...findings].sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
  const lines = sorted.map((f) => {
    const where = f.file ? ` (${f.file}${f.line ? `:${f.line}` : ""})` : "";
    return `${f.severity.toUpperCase().padEnd(5)} [${f.check}] ${f.message}${where}`;
  });
  const errors = findings.filter((f) => f.severity === "error").length;
  const warns = findings.filter((f) => f.severity === "warn").length;
  lines.push("", `${errors} error(s), ${warns} warning(s)`);
  return lines.join("\n") + "\n";
}

export function formatJson(findings: Finding[]): string {
  return JSON.stringify({ ok: !findings.some((f) => f.severity === "error"), findings }, null, 2) + "\n";
}

export function exitCode(findings: Finding[]): number {
  return findings.some((f) => f.severity === "error") ? 1 : 0;
}

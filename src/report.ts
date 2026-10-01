import type { Finding, Severity } from "./types.js";

const ORDER: Record<Severity, number> = { error: 0, warn: 1, info: 2 };
const COLOR: Record<Severity, string> = { error: "\x1b[31m", warn: "\x1b[33m", info: "\x1b[36m" };
const RESET = "\x1b[0m";

export interface TextOptions {
  color?: boolean;
  /** Only show errors. */
  quiet?: boolean;
}

export function formatText(findings: Finding[], options: TextOptions = {}): string {
  const shown = options.quiet ? findings.filter((f) => f.severity === "error") : findings;
  if (findings.length === 0) return "All checks passed.\n";
  const sorted = [...shown].sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
  const lines = sorted.map((f) => {
    const where = f.file ? ` (${f.file}${f.line ? `:${f.line}` : ""})` : "";
    const label = f.severity.toUpperCase().padEnd(5);
    const head = options.color ? `${COLOR[f.severity]}${label}${RESET}` : label;
    return `${head} [${f.check}] ${f.message}${where}`;
  });
  const count = (s: Severity) => findings.filter((f) => f.severity === s).length;
  lines.push("", `${count("error")} error(s), ${count("warn")} warning(s), ${count("info")} note(s)`);
  return lines.join("\n") + "\n";
}

export function formatJson(findings: Finding[]): string {
  return JSON.stringify({ ok: !findings.some((f) => f.severity === "error"), findings }, null, 2) + "\n";
}

export function exitCode(findings: Finding[]): number {
  return findings.some((f) => f.severity === "error") ? 1 : 0;
}

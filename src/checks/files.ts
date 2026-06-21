import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Finding } from "../types.js";

const REQUIRED = [
  { name: "README", pattern: /^readme(\.[a-z]+)?$/i, severity: "error" as const },
  { name: "LICENSE", pattern: /^(license|licence|copying)(\.[a-z]+)?$/i, severity: "error" as const },
  { name: "ROADMAP", pattern: /^roadmap(\.[a-z]+)?$/i, severity: "warn" as const },
];

export function checkRequiredFiles(root: string): Finding[] {
  if (!existsSync(root)) {
    return [{ check: "files", severity: "error", message: `Path does not exist: ${root}` }];
  }
  const entries = readdirSync(root);
  const findings: Finding[] = [];
  for (const req of REQUIRED) {
    if (!entries.some((e) => req.pattern.test(e))) {
      findings.push({
        check: "files",
        severity: req.severity,
        message: `Missing ${req.name} file in the top folder`,
      });
    }
  }
  if (!existsSync(join(root, ".gitignore"))) {
    findings.push({ check: "files", severity: "warn", message: "Missing .gitignore" });
  }
  return findings;
}

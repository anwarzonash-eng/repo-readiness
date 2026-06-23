import type { Finding } from "../types.js";

const ENV_FILE = /(^|\/)\.env(\.[\w.-]+)?$/;
const SAFE_SUFFIX = /\.(example|sample|template|dist)$/;

export function checkTrackedEnvFiles(tracked: string[]): Finding[] {
  const findings: Finding[] = [];
  for (const file of tracked) {
    if (ENV_FILE.test(file) && !SAFE_SUFFIX.test(file)) {
      findings.push({
        check: "env",
        severity: "error",
        file,
        message: "Env file is tracked by git; remove it and add it to .gitignore",
      });
    }
  }
  const hasExample = tracked.some((f) => ENV_FILE.test(f) && SAFE_SUFFIX.test(f));
  const hasEnvUsage = tracked.some((f) => ENV_FILE.test(f));
  if (hasEnvUsage && !hasExample) {
    findings.push({
      check: "env",
      severity: "warn",
      message: "No .env.example found; add one with placeholder values",
    });
  }
  return findings;
}

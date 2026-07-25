import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Finding } from "../types.js";

const EMAIL = /[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})/g;
const SAFE_DOMAINS = /^(example\.(com|org|net)|users\.noreply\.github\.com|noreply\.github\.com|localhost|test|invalid)$/i;
const SKIP = /(\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|woff2?|ttf|lock)$|(^|\/)package-lock\.json$)/i;
const MAX_BYTES = 1024 * 1024;

export function findEmails(text: string, file: string): Finding[] {
  const findings: Finding[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    for (const m of lines[i].matchAll(EMAIL)) {
      if (SAFE_DOMAINS.test(m[1])) continue;
      findings.push({
        check: "personal-data",
        severity: "warn",
        file,
        line: i + 1,
        message: "Email address that may be real personal data; use an example.com address",
      });
    }
  }
  return findings;
}

export function scanEmails(root: string, files: string[]): Finding[] {
  const findings: Finding[] = [];
  for (const file of files) {
    if (SKIP.test(file)) continue;
    try {
      const full = join(root, file);
      if (statSync(full).size > MAX_BYTES) continue;
      findings.push(...findEmails(readFileSync(full, "utf8"), file));
    } catch {
      // unreadable file: skip
    }
  }
  return findings;
}

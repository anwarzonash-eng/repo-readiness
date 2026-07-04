import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Finding } from "../types.js";

interface Rule {
  name: string;
  pattern: RegExp;
}

export const RULES: Rule[] = [
  { name: "AWS access key id", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "GitHub token", pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
  { name: "Stripe secret key", pattern: /\b[sr]k_live_[A-Za-z0-9]{20,}\b/ },
  { name: "Slack token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: "Google API key", pattern: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: "Private key block", pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
  { name: "Connection string with password", pattern: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s:@/]+:[^\s@/]+@/ },
];

const SKIP_EXT = /\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|mp[34]|woff2?|ttf|lock)$/i;
const SKIP_FILE = /(^|\/)package-lock\.json$/;
const MAX_BYTES = 1024 * 1024;

export function scanText(text: string, file: string): Finding[] {
  const findings: Finding[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    for (const rule of RULES) {
      if (rule.pattern.test(lines[i])) {
        findings.push({
          check: "secrets",
          severity: "error",
          file,
          line: i + 1,
          message: `Possible ${rule.name}`,
        });
      }
    }
  }
  return findings;
}

export function scanFiles(root: string, files: string[]): Finding[] {
  const findings: Finding[] = [];
  for (const file of files) {
    if (SKIP_EXT.test(file) || SKIP_FILE.test(file)) continue;
    const full = join(root, file);
    try {
      if (statSync(full).size > MAX_BYTES) continue;
      findings.push(...scanText(readFileSync(full, "utf8"), file));
    } catch {
      // unreadable or deleted file: skip
    }
  }
  return findings;
}

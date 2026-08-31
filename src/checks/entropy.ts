import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Finding } from "../types.js";
import { IGNORE_MARKER } from "./secrets.js";

const ASSIGNMENT =
  /(secret|token|passw(?:or)?d|passwd|api[_-]?key|apikey|auth[_-]?key|credential|private[_-]?key)[\w-]*["']?\s*[:=]\s*["']([^"'\s]{16,})["']/i;
const PLACEHOLDER = /(example|your|change|replace|placeholder|sample|dummy|xxxx|<|>|\$\{|process\.env|env\.)/i;
const SKIP = /(\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|woff2?|ttf|lock)$|(^|\/)package-lock\.json$)/i;
const MAX_BYTES = 1024 * 1024;
export const MIN_ENTROPY = 3.5;

/** Shannon entropy in bits per character. */
export function entropy(value: string): number {
  if (value.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const ch of value) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  let h = 0;
  for (const n of counts.values()) {
    const p = n / value.length;
    h -= p * Math.log2(p);
  }
  return h;
}

export function findHighEntropyAssignments(text: string, file: string): Finding[] {
  const findings: Finding[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (IGNORE_MARKER.test(lines[i])) continue;
    const m = ASSIGNMENT.exec(lines[i]);
    if (!m) continue;
    const value = m[2];
    if (PLACEHOLDER.test(value) || PLACEHOLDER.test(lines[i])) continue;
    if (entropy(value) < MIN_ENTROPY) continue;
    findings.push({
      check: "secrets",
      severity: "error",
      file,
      line: i + 1,
      message: `High-entropy value assigned to "${m[1]}"; looks like a hard-coded secret`,
    });
  }
  return findings;
}

export function scanEntropy(root: string, files: string[]): Finding[] {
  const findings: Finding[] = [];
  for (const file of files) {
    if (SKIP.test(file)) continue;
    try {
      const full = join(root, file);
      if (statSync(full).size > MAX_BYTES) continue;
      findings.push(...findHighEntropyAssignments(readFileSync(full, "utf8"), file));
    } catch {
      // unreadable file: skip
    }
  }
  return findings;
}

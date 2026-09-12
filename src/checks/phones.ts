import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Finding } from "../types.js";
import { IGNORE_MARKER } from "./secrets.js";

// International numbers with a leading +, and US style with the area code in parentheses.
const INTERNATIONAL = /(?<![\w.])\+\d{1,3}[ .-]?\(?\d{1,4}\)?(?:[ .-]?\d{2,4}){2,4}(?!\d)/g;
const US = /(?<![\w.])\(?\d{3}\)[ -]?\d{3}-\d{4}(?!\d)/g;
// Numbers reserved for fiction: UK Ofcom drama range, US 555-01xx.
const FICTIONAL = /(7700[ .-]?900\d{3}|555[ .-]?01\d{2})/;
const SKIP = /(\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|woff2?|ttf|lock|svg)$|(^|\/)package-lock\.json$)/i;
const MAX_BYTES = 1024 * 1024;

export function findPhones(text: string, file: string): Finding[] {
  const findings: Finding[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (IGNORE_MARKER.test(lines[i])) continue;
    const hits = [...lines[i].matchAll(INTERNATIONAL), ...lines[i].matchAll(US)];
    for (const m of hits) {
      if (FICTIONAL.test(m[0])) continue;
      const digits = m[0].replace(/\D/g, "");
      if (digits.length < 8 || digits.length > 15) continue;
      findings.push({
        check: "personal-data",
        severity: "warn",
        file,
        line: i + 1,
        message: "Phone number that may be real personal data; use a fictional number",
      });
    }
  }
  return findings;
}

export function scanPhones(root: string, files: string[]): Finding[] {
  const findings: Finding[] = [];
  for (const file of files) {
    if (SKIP.test(file)) continue;
    try {
      const full = join(root, file);
      if (statSync(full).size > MAX_BYTES) continue;
      findings.push(...findPhones(readFileSync(full, "utf8"), file));
    } catch {
      // unreadable file: skip
    }
  }
  return findings;
}

import type { Finding } from "../types.js";

const JUNK: { pattern: RegExp; what: string }[] = [
  { pattern: /(^|\/)node_modules\//, what: "dependency folder" },
  { pattern: /(^|\/)(dist|build|out|coverage|\.next)\//, what: "build output" },
  { pattern: /\.log$/i, what: "log file" },
  { pattern: /(^|\/)(\.DS_Store|Thumbs\.db)$/, what: "OS metadata file" },
  { pattern: /\.(sqlite3?|db|dump|bak)$/i, what: "database or backup file" },
];

export function checkJunk(
  tracked: string[],
  sizeOf: (file: string) => number | null,
  maxBytes: number,
): Finding[] {
  const findings: Finding[] = [];
  for (const file of tracked) {
    const hit = JUNK.find((j) => j.pattern.test(file));
    if (hit) {
      findings.push({
        check: "junk",
        severity: "warn",
        file,
        message: `Tracked ${hit.what}; it usually should not be in git`,
      });
    }
    const size = sizeOf(file);
    if (size !== null && size > maxBytes) {
      findings.push({
        check: "junk",
        severity: "warn",
        file,
        message: `Large file (${(size / 1024 / 1024).toFixed(1)} MB)`,
      });
    }
  }
  return findings;
}

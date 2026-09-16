import { execFileSync } from "node:child_process";
import type { Finding } from "../types.js";

const PLACEHOLDER_EMAIL = /(@localhost|@.*\.local$|@(none|unknown)|^root@|^unknown@|^user@|^you@|^your@)/i;
const NOREPLY = /noreply/i;

export interface Identity {
  name: string;
  email: string;
  commits: number;
}

export function parseAuthorLines(lines: string[]): Identity[] {
  const map = new Map<string, Identity>();
  for (const line of lines) {
    if (!line.includes("|")) continue;
    const [name, email] = line.split("|");
    const key = `${name}|${email.toLowerCase()}`;
    const entry = map.get(key) ?? { name, email: email.toLowerCase(), commits: 0 };
    entry.commits++;
    map.set(key, entry);
  }
  return [...map.values()].sort((a, b) => b.commits - a.commits);
}

export function analyzeAuthors(identities: Identity[]): Finding[] {
  const findings: Finding[] = [];
  for (const id of identities) {
    if (PLACEHOLDER_EMAIL.test(id.email)) {
      findings.push({
        check: "authors",
        severity: "warn",
        message: `Commits by ${id.name} use a placeholder email (${id.email}); GitHub cannot link it to an account`,
      });
    }
  }
  const emails = new Set(identities.filter((i) => !NOREPLY.test(i.email)).map((i) => i.email));
  if (emails.size > 1) {
    findings.push({
      check: "authors",
      severity: "info",
      message: `History has ${emails.size} different author emails; consider a .mailmap to unify them`,
    });
  }
  const namesByEmail = new Map<string, Set<string>>();
  for (const i of identities) {
    const set = namesByEmail.get(i.email) ?? new Set<string>();
    set.add(i.name);
    namesByEmail.set(i.email, set);
  }
  for (const [email, names] of namesByEmail) {
    if (names.size > 1) {
      findings.push({
        check: "authors",
        severity: "info",
        message: `${email} appears under ${names.size} names (${[...names].join(", ")})`,
      });
    }
  }
  return findings;
}

export function checkAuthors(root: string): Finding[] {
  try {
    const out = execFileSync("git", ["log", "--all", "--format=%an|%ae"], {
      cwd: root,
      maxBuffer: 64 * 1024 * 1024,
    });
    return analyzeAuthors(parseAuthorLines(out.toString("utf8").split(/\r?\n/).filter(Boolean)));
  } catch {
    return []; // an empty repository has no log
  }
}

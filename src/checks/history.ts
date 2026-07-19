import { execFileSync } from "node:child_process";
import type { Finding } from "../types.js";
import { RULES } from "./secrets.js";

/** Parse `git log -p -U0` output and report added lines that match a secret rule. */
export function scanDiffText(diff: string): Finding[] {
  const findings: Finding[] = [];
  const seen = new Set<string>();
  let commit = "";
  let file = "";
  for (const line of diff.split(/\r?\n/)) {
    if (line.startsWith("commit:")) {
      commit = line.slice(7);
    } else if (line.startsWith("+++ b/")) {
      file = line.slice(6);
    } else if (line.startsWith("+") && !line.startsWith("+++")) {
      for (const rule of RULES) {
        if (!rule.pattern.test(line)) continue;
        const key = `${rule.name}|${file}|${commit}`;
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push({
          check: "history",
          severity: "error",
          file,
          message: `Possible ${rule.name} in commit ${commit}`,
        });
      }
    }
  }
  return findings;
}

export function scanHistory(root: string): Finding[] {
  let out: Buffer;
  try {
    out = execFileSync(
      "git",
      ["log", "--all", "-p", "-U0", "--no-color", "--format=commit:%h"],
      { cwd: root, maxBuffer: 512 * 1024 * 1024 },
    );
  } catch {
    return [{ check: "history", severity: "warn", message: "Could not read git history" }];
  }
  return scanDiffText(out.toString("utf8"));
}

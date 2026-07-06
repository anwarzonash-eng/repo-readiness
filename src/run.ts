import { resolve } from "node:path";
import { checkTrackedEnvFiles } from "./checks/env.js";
import { checkRequiredFiles } from "./checks/files.js";
import { scanFiles } from "./checks/secrets.js";
import { isGitRepo, trackedFiles } from "./git.js";
import type { Finding } from "./types.js";

export function runChecks(path: string): Finding[] {
  const root = resolve(path);
  const findings = checkRequiredFiles(root);
  if (findings.some((f) => f.message.startsWith("Path does not exist"))) return findings;

  if (!isGitRepo(root)) {
    findings.push({ check: "git", severity: "error", message: "Not a git repository" });
    return findings;
  }
  const tracked = trackedFiles(root);
  findings.push(...checkTrackedEnvFiles(tracked));
  findings.push(...scanFiles(root, tracked));
  return findings;
}

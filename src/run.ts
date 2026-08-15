import { statSync } from "node:fs";
import { join, resolve } from "node:path";
import { checkJunk } from "./checks/junk.js";
import { scanEmails } from "./checks/emails.js";
import { checkTrackedEnvFiles } from "./checks/env.js";
import { checkRequiredFiles } from "./checks/files.js";
import { scanHistory } from "./checks/history.js";
import { scanFiles } from "./checks/secrets.js";
import { ConfigError, DEFAULT_CONFIG, loadConfig, makeIgnore } from "./config.js";
import type { Config } from "./config.js";
import { isGitRepo, trackedFiles } from "./git.js";
import type { Finding } from "./types.js";

export interface Options {
  history?: boolean;
}

export function runChecks(path: string, options: Options = {}): Finding[] {
  const root = resolve(path);
  const findings = checkRequiredFiles(root);
  if (findings.some((f) => f.message.startsWith("Path does not exist"))) return findings;

  let config: Config = DEFAULT_CONFIG;
  try {
    config = loadConfig(root);
  } catch (err) {
    if (!(err instanceof ConfigError)) throw err;
    findings.push({ check: "config", severity: "error", message: err.message });
  }
  const ignored = makeIgnore(config.ignorePaths);

  if (!isGitRepo(root)) {
    findings.push({ check: "git", severity: "error", message: "Not a git repository" });
    return applyConfig(findings, config, ignored);
  }

  const tracked = trackedFiles(root).filter((f) => !ignored(f));
  const sizeOf = (file: string): number | null => {
    try {
      return statSync(join(root, file)).size;
    } catch {
      return null;
    }
  };

  findings.push(...checkTrackedEnvFiles(tracked));
  findings.push(...checkJunk(tracked, sizeOf, config.maxFileSizeMB * 1024 * 1024));
  findings.push(...scanFiles(root, tracked));
  findings.push(...scanEmails(root, tracked));
  if (options.history) findings.push(...scanHistory(root));
  return applyConfig(findings, config, ignored);
}

function applyConfig(findings: Finding[], config: Config, ignored: (f: string) => boolean): Finding[] {
  const disabled = new Set(config.disable);
  return findings.filter((f) => !disabled.has(f.check) && !(f.file && ignored(f.file)));
}

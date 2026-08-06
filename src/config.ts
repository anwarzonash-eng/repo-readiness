import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface Config {
  /** Glob patterns (relative to the repo root) that are never scanned. */
  ignorePaths: string[];
  /** Check names to switch off, e.g. "personal-data". */
  disable: string[];
  /** Tracked files larger than this are reported by the junk check. */
  maxFileSizeMB: number;
}

export const CONFIG_FILE = ".repo-readiness.json";

export const DEFAULT_CONFIG: Config = {
  ignorePaths: [],
  disable: [],
  maxFileSizeMB: 5,
};

export class ConfigError extends Error {}

export function parseConfig(text: string): Config {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ConfigError(`${CONFIG_FILE} is not valid JSON`);
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new ConfigError(`${CONFIG_FILE} must contain a JSON object`);
  }
  const obj = raw as Record<string, unknown>;
  const config: Config = { ...DEFAULT_CONFIG };

  for (const key of ["ignorePaths", "disable"] as const) {
    if (obj[key] === undefined) continue;
    const value = obj[key];
    if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
      throw new ConfigError(`"${key}" must be an array of strings`);
    }
    config[key] = value as string[];
  }
  if (obj.maxFileSizeMB !== undefined) {
    if (typeof obj.maxFileSizeMB !== "number" || !(obj.maxFileSizeMB > 0)) {
      throw new ConfigError(`"maxFileSizeMB" must be a positive number`);
    }
    config.maxFileSizeMB = obj.maxFileSizeMB;
  }
  const known = new Set(["ignorePaths", "disable", "maxFileSizeMB"]);
  for (const key of Object.keys(obj)) {
    if (!known.has(key)) throw new ConfigError(`Unknown option "${key}"`);
  }
  return config;
}

export function loadConfig(root: string): Config {
  const file = join(root, CONFIG_FILE);
  if (!existsSync(file)) return { ...DEFAULT_CONFIG };
  return parseConfig(readFileSync(file, "utf8"));
}

/** Convert a small glob (`*`, `**`, `?`) into a RegExp. A trailing `/` matches a folder. */
export function globToRegExp(glob: string): RegExp {
  let g = glob.replace(/^\.\//, "");
  if (g.endsWith("/")) g += "**";
  let re = "";
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === "*") {
      if (g[i + 1] === "*") {
        re += ".*";
        i++;
        if (g[i + 1] === "/") i++;
      } else {
        re += "[^/]*";
      }
    } else if (c === "?") {
      re += "[^/]";
    } else {
      re += ".+^$()|{}[]\\".includes(c) ? "\\" + c : c;
    }
  }
  const anchored = g.includes("/") ? `^${re}$` : `(^|/)${re}$`;
  return new RegExp(anchored);
}

export function makeIgnore(globs: string[]): (file: string) => boolean {
  const regexes = globs.map(globToRegExp);
  return (file) => regexes.some((r) => r.test(file));
}

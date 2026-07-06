#!/usr/bin/env node
import { parseArgs } from "node:util";
import { exitCode, formatJson, formatText } from "./report.js";
import { runChecks } from "./run.js";

const VERSION = "0.1.0";

const HELP = `repo-readiness ${VERSION}

Checks a git repository before you publish it.

Usage:
  repo-readiness [path] [options]

Options:
  --json        print the report as JSON
  -h, --help    show this help
  -v, --version show the version
`;

function main(argv: string[]): number {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      json: { type: "boolean" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  });

  if (values.help) {
    process.stdout.write(HELP);
    return 0;
  }
  if (values.version) {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }

  const target = positionals[0] ?? process.cwd();
  const findings = runChecks(target);
  process.stdout.write(values.json ? formatJson(findings) : formatText(findings));
  return exitCode(findings);
}

process.exitCode = main(process.argv.slice(2));

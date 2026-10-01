#!/usr/bin/env node
import { parseArgs } from "node:util";
import { formatSuggestions } from "./fixes.js";
import { exitCode, formatJson, formatText } from "./report.js";
import { runChecks } from "./run.js";
import { formatSarif } from "./sarif.js";

const VERSION = "0.2.0";

const HELP = `repo-readiness ${VERSION}

Checks a git repository before you publish it.

Usage:
  repo-readiness [path] [options]

Options:
  --history          also scan every past commit for secrets (slower)
  --format <name>    text (default), json or sarif
  --json             same as --format json
  --suggest          print suggested fixes after the report (changes nothing)
  --quiet            only list errors in the text report
  --no-color         disable colored output
  -h, --help         show this help
  -v, --version      show the version

Configuration: put a ${".repo-readiness.json"} in the repository with
  { "ignorePaths": ["fixtures/"], "disable": ["personal-data"], "maxFileSizeMB": 5 }
Add "repo-readiness-ignore" to a line to skip it.

Exit code is 1 when at least one error is found.
`;

function fail(message: string): number {
  process.stderr.write(`repo-readiness: ${message}\n`);
  return 2;
}

function main(argv: string[]): number {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        history: { type: "boolean" },
        format: { type: "string" },
        json: { type: "boolean" },
        suggest: { type: "boolean" },
        quiet: { type: "boolean" },
        "no-color": { type: "boolean" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
      },
    });
  } catch (err) {
    return fail((err as Error).message);
  }
  const { values, positionals } = parsed;

  if (values.help) {
    process.stdout.write(HELP);
    return 0;
  }
  if (values.version) {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }
  if (positionals.length > 1) return fail("only one path can be checked at a time");

  const format = values.json ? "json" : (values.format ?? "text");
  if (!["text", "json", "sarif"].includes(format)) {
    return fail(`unknown format "${format}" (use text, json or sarif)`);
  }

  const findings = runChecks(positionals[0] ?? process.cwd(), { history: values.history });
  const color = !values["no-color"] && !process.env.NO_COLOR && Boolean(process.stdout.isTTY);

  if (format === "json") process.stdout.write(formatJson(findings));
  else if (format === "sarif") process.stdout.write(formatSarif(findings, VERSION));
  else {
    process.stdout.write(formatText(findings, { color, quiet: values.quiet }));
    if (values.suggest) process.stdout.write(formatSuggestions(findings));
  }
  return exitCode(findings);
}

process.exitCode = main(process.argv.slice(2));

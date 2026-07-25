# repo-readiness

A command-line tool that checks a git repository before you make it public. It looks for the basics reviewers expect (README, LICENSE, ROADMAP, `.gitignore`), flags tracked `.env` files, and scans for common secret patterns in the files and, optionally, in the whole commit history.

It is for developers who want a quick pre-publish check and a non-zero exit code for CI. It is written in TypeScript with no runtime dependencies, and it never sends anything over the network.

## Install and run

Requirements: Node.js 18+ and git.

```bash
git clone https://github.com/anwarzonash-eng/repo-readiness.git
cd repo-readiness
npm install
npm run build

node dist/cli.js [path] [options]
```

| Option | What it does |
| --- | --- |
| `path` | Repository to check (default: current folder) |
| `--history` | Also scan every past commit, including secrets that were added and later deleted |
| `--json` | Print the report as JSON |
| `-h`, `--help` / `-v`, `--version` | Help and version |

Exit code is `1` when any error is found and `0` otherwise, so it can gate a CI job.

Example:

```
ERROR [files] Missing LICENSE file in the top folder
ERROR [secrets] Possible AWS access key id (src/config.js:12)
WARN  [files] Missing ROADMAP file in the top folder

2 error(s), 1 warning(s)
```

## What it checks

| Check | Severity | Looks for |
| --- | --- | --- |
| `files` | error / warn | README and LICENSE (error), ROADMAP and `.gitignore` (warn) |
| `env` | error / warn | Tracked `.env*` files (not `.example`), missing `.env.example` |
| `secrets` | error | AWS, GitHub, Stripe, Slack and Google keys, private key blocks, database URLs with passwords |
| `personal-data` | warn | Emails outside example domains |
| `history` | error | The secret rules applied to every line ever added (`--history`) |

Matching is heuristic: expect some false positives and some misses. It does not replace a dedicated scanner.

## Development

```bash
npm test      # builds and runs the node:test suite
```

```
src/
  cli.ts        argument parsing and entry point
  run.ts        runs all checks for a path
  report.ts     text / JSON output and exit code
  git.ts        small git helpers
  checks/       files, env, secrets, history, emails
```

## License

[MIT](LICENSE)

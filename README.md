# repo-readiness

A command-line tool that checks a git repository before you make it public. It verifies the basics reviewers expect (README, LICENSE, ROADMAP, `.gitignore`), recognises the license type, flags tracked `.env` files and junk, hunts for secrets and personal data in the working tree and, optionally, in the whole commit history, and reports mixed or placeholder commit identities. It can print suggested fixes and export SARIF for code-scanning dashboards.

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
| `--format text\|json\|sarif` | Output format (`--json` is a shortcut for `--format json`) |
| `--suggest` | Print suggested fix commands after the report (changes nothing) |
| `--quiet` | List only errors in the text report |
| `--no-color` | Disable colored output (also honours `NO_COLOR`) |
| `-h`, `--help` / `-v`, `--version` | Help and version |

Exit codes: `0` no errors, `1` at least one error, `2` usage error.

Example:

```
ERROR [env] Env file is tracked by git; remove it and add it to .gitignore (.env)
ERROR [secrets] High-entropy value assigned to "apiKey"; looks like a hard-coded secret (app.js:1)
WARN  [junk] Tracked dependency folder; it usually should not be in git (node_modules/a.js)

2 error(s), 1 warning(s), 0 note(s)

Suggested fixes:
  - git rm --cached .env
  - echo .env >> .gitignore
```

## What it checks

| Check | Severity | Looks for |
| --- | --- | --- |
| `files` | error / warn | README and LICENSE (error), ROADMAP and `.gitignore` (warn) |
| `license` | error / warn | Detects MIT, Apache-2.0, BSD, ISC, MPL, GPL family and more; errors for non-open licenses (BUSL, SSPL, PolyForm, CC NC/ND), warns for copyleft, unknown text, or a mismatch with `package.json` |
| `env` | error / warn | Tracked `.env*` files (not `.example`), missing `.env.example` |
| `junk` | warn | Tracked `node_modules/`, build output, logs, database files, OS files, and files over the size limit |
| `secrets` | error | AWS, GitHub, Stripe, Slack and Google keys, private key blocks, database URLs with passwords, and high-entropy values assigned to names like `token`, `password`, `api_key` |
| `personal-data` | warn | Emails outside example domains, phone numbers outside fictional ranges |
| `authors` | warn / note | Placeholder author emails, several emails or names for one person (`.mailmap` hint) |
| `history` | error | The secret rules applied to every line ever added (`--history`) |

Matching is heuristic: expect some false positives and some misses. It does not replace a dedicated scanner.

## Configuration

Add `.repo-readiness.json` to the repository root:

```json
{
  "ignorePaths": ["fixtures/", "*.min.js"],
  "disable": ["personal-data"],
  "maxFileSizeMB": 5
}
```

- `ignorePaths`: globs (`*`, `**`, `?`; a trailing `/` means a folder) that are never scanned
- `disable`: check names to switch off
- `maxFileSizeMB`: size limit for the `junk` check

To skip one line (for example a test fixture), add `repo-readiness-ignore` to it, such as in a trailing comment.

## Use it in CI

```yaml
- run: node dist/cli.js . --history --quiet
```

The step fails when an error is found. For GitHub code scanning, write SARIF to a file with `--format sarif > results.sarif` and upload it.

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

# Roadmap

Planned work on this project. Done items are checked.

## Done
- [x] Required files, tracked env files, secret patterns
- [x] `--history` scan of past commits
- [x] Config file, inline ignore marker
- [x] License detection and `package.json` comparison
- [x] Junk and large-file check
- [x] Entropy-based secret detection
- [x] Email and phone number checks
- [x] Author identity check
- [x] SARIF output, `--suggest`, `--quiet`, color
- [x] GitHub Actions workflow on Node 18, 20, 22

## Next: detection quality
- [ ] More secret rules (Azure, SendGrid, Twilio, npm and PyPI tokens, JWTs)
- [ ] Allow-list file for known false positives with a reason
- [ ] Street address and national ID patterns in the personal-data check
- [ ] Scan renamed and binary-looking text files safely
- [ ] Per-rule severity overrides in the config

## Next: history
- [ ] Stream `git log` instead of buffering it, for very large repositories
- [ ] Report the first commit where a secret appeared and whether it is still in the tree
- [ ] Detect large files that were committed and later deleted (they still bloat history)
- [ ] `--since <commit>` to scan only new commits (fast CI mode)

## Next: usability
- [ ] `--fix` mode that applies the safe fixes (`.gitignore` lines, `git rm --cached`) after confirmation
- [ ] Generate a `.mailmap` file from the author report
- [ ] Generate a starter README, ROADMAP and LICENSE (`init` command)
- [ ] Group the text report by check or by file
- [ ] Shell completion scripts

## Next: integrations
- [ ] Pre-commit and pre-push hook installer
- [ ] GitHub Action wrapper that uploads SARIF automatically
- [ ] Markdown report for pull request comments

## Quality and release
- [ ] Benchmarks on large repositories and a performance budget
- [ ] Property-based tests for the glob matcher and entropy function
- [ ] Windows and macOS runners in CI
- [ ] Publish to npm with provenance and tag releases
- [ ] Contributing guide and issue templates

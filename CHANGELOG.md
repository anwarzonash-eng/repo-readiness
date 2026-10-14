# Changelog

## 0.2.0
- Config file `.repo-readiness.json` (ignore paths, disable checks, size limit)
- Inline `repo-readiness-ignore` marker
- New checks: license detection, junk and large files, high-entropy secrets, phone numbers, author identities
- `--format sarif`, `--suggest`, `--quiet`, `--no-color`, usage errors exit with code 2
- Integration and CLI tests

## 0.1.0
- Required-files, tracked-env and secret-pattern checks
- `--history` scan of past commits
- Text and JSON output, exit code 1 on errors

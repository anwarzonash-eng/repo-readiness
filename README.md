# repo-readiness

Work in progress: a small command-line tool that checks a git repository before you make it public.

So far it checks for README, LICENSE, ROADMAP and `.gitignore`, flags tracked `.env` files and looks for common secret patterns.

Requirements: Node.js 18+ and git.

```bash
npm install
npm run build
node dist/cli.js [path] [--json] [--history]
npm test
```

Exits with code `1` when an error is found.

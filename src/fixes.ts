import type { Finding } from "./types.js";

/** Turn findings into concrete suggestions. Nothing is changed on disk. */
export function suggestFixes(findings: Finding[]): string[] {
  const out: string[] = [];
  const add = (s: string) => {
    if (!out.includes(s)) out.push(s);
  };
  for (const f of findings) {
    switch (f.check) {
      case "env":
        if (f.file) {
          add(`git rm --cached ${f.file}`);
          add(`echo ${f.file.split("/").pop()} >> .gitignore`);
        }
        break;
      case "junk":
        if (f.file) add(`git rm --cached ${f.file}   # and add it to .gitignore`);
        break;
      case "secrets":
      case "history":
        add("Revoke the exposed key or token at its provider first.");
        add("Remove it from history: git filter-repo --replace-text replacements.txt");
        break;
      case "personal-data":
        add("Replace real emails and phone numbers with fictional ones (user@example.com, +44 7700 900123).");
        break;
      case "files":
        if (/LICENSE/.test(f.message)) add("Add a LICENSE file (for example MIT) to the top folder.");
        if (/README/.test(f.message)) add("Add a README that says what the project does, who it is for and how to run it.");
        if (/ROADMAP/.test(f.message)) add("Add a ROADMAP.md with your planned work.");
        if (/\.gitignore/.test(f.message)) add("Add a .gitignore (node_modules/, dist/, .env, *.log).");
        break;
      case "authors":
        add("To unify author identities, create a .mailmap (git shortlog -sne lists them).");
        break;
    }
  }
  return out;
}

export function formatSuggestions(findings: Finding[]): string {
  const fixes = suggestFixes(findings);
  if (fixes.length === 0) return "";
  return ["", "Suggested fixes:", ...fixes.map((f) => `  - ${f}`), ""].join("\n");
}

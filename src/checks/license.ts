import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Finding } from "../types.js";

interface Signature {
  id: string;
  test: (t: string) => boolean;
}

// Order matters: more specific licenses first.
const SIGNATURES: Signature[] = [
  { id: "AGPL-3.0", test: (t) => /GNU AFFERO GENERAL PUBLIC LICENSE\s+Version 3/i.test(t) },
  { id: "LGPL-3.0", test: (t) => /GNU LESSER GENERAL PUBLIC LICENSE\s+Version 3/i.test(t) },
  { id: "LGPL-2.1", test: (t) => /GNU LESSER GENERAL PUBLIC LICENSE\s+Version 2\.1/i.test(t) },
  { id: "GPL-3.0", test: (t) => /GNU GENERAL PUBLIC LICENSE\s+Version 3/i.test(t) },
  { id: "GPL-2.0", test: (t) => /GNU GENERAL PUBLIC LICENSE\s+Version 2/i.test(t) },
  { id: "Apache-2.0", test: (t) => /Apache License\s+Version 2\.0/i.test(t) },
  { id: "MPL-2.0", test: (t) => /Mozilla Public License Version 2\.0/i.test(t) },
  { id: "BUSL-1.1", test: (t) => /Business Source License/i.test(t) },
  { id: "SSPL-1.0", test: (t) => /Server Side Public License/i.test(t) },
  { id: "Elastic-2.0", test: (t) => /Elastic License 2\.0/i.test(t) },
  { id: "PolyForm", test: (t) => /PolyForm/i.test(t) },
  { id: "CC-BY-NC", test: (t) => /Attribution-NonCommercial/i.test(t) },
  { id: "CC-BY-ND", test: (t) => /Attribution-NoDerivatives/i.test(t) },
  { id: "Unlicense", test: (t) => /free and unencumbered software released into the public domain/i.test(t) },
  { id: "CC0-1.0", test: (t) => /CC0 1\.0 Universal/i.test(t) },
  { id: "ISC", test: (t) => /Permission to use, copy, modify, and\/or distribute this software for any\s+purpose with or without fee/i.test(t) },
  {
    id: "BSD-3-Clause",
    test: (t) => /Redistribution and use in source and binary forms/i.test(t) && /Neither the name/i.test(t),
  },
  { id: "BSD-2-Clause", test: (t) => /Redistribution and use in source and binary forms/i.test(t) },
  {
    id: "MIT",
    test: (t) => /Permission is hereby granted, free of charge/i.test(t) && /THE SOFTWARE IS PROVIDED "AS IS"/i.test(t),
  },
];

const COPYLEFT = new Set(["GPL-2.0", "GPL-3.0", "LGPL-2.1", "LGPL-3.0", "AGPL-3.0"]);
const RESTRICTED = new Set(["BUSL-1.1", "SSPL-1.0", "Elastic-2.0", "PolyForm", "CC-BY-NC", "CC-BY-ND"]);

export function detectLicense(text: string): string | null {
  const hit = SIGNATURES.find((s) => s.test(text));
  return hit ? hit.id : null;
}

function normalize(id: string): string {
  return id.toLowerCase().replace(/-only$|-or-later$/, "");
}

export function evaluateLicense(licenseText: string, packageLicense: string | null): Finding[] {
  const detected = detectLicense(licenseText);
  const findings: Finding[] = [];
  if (!detected) {
    findings.push({
      check: "license",
      severity: "warn",
      file: "LICENSE",
      message: "License text is not recognised; use an unmodified standard license text",
    });
    return findings;
  }
  if (RESTRICTED.has(detected)) {
    findings.push({
      check: "license",
      severity: "error",
      file: "LICENSE",
      message: `${detected} is not an open-source license; many programs and users cannot accept it`,
    });
  } else if (COPYLEFT.has(detected)) {
    findings.push({
      check: "license",
      severity: "warn",
      file: "LICENSE",
      message: `${detected} is a copyleft license; some programs require an extra approval for it`,
    });
  }
  if (packageLicense && normalize(packageLicense) !== normalize(detected)) {
    findings.push({
      check: "license",
      severity: "warn",
      file: "package.json",
      message: `package.json says "${packageLicense}" but the LICENSE file looks like ${detected}`,
    });
  }
  return findings;
}

export function checkLicense(root: string): Finding[] {
  if (!existsSync(root)) return [];
  const name = readdirSync(root).find((e) => /^(license|licence|copying)(\.[a-z]+)?$/i.test(e));
  if (!name) return []; // a missing file is reported by the files check
  let packageLicense: string | null = null;
  const pkg = join(root, "package.json");
  if (existsSync(pkg)) {
    try {
      const parsed = JSON.parse(readFileSync(pkg, "utf8"));
      if (typeof parsed.license === "string") packageLicense = parsed.license;
    } catch {
      // invalid package.json is not this check's concern
    }
  }
  return evaluateLicense(readFileSync(join(root, name), "utf8"), packageLicense);
}

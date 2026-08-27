import { test } from "node:test";
import assert from "node:assert/strict";
import { detectLicense, evaluateLicense } from "./license.js";

const MIT = `MIT License

Copyright (c) 2026 Someone

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.`;

test("detects common licenses", () => {
  assert.equal(detectLicense(MIT), "MIT");
  assert.equal(detectLicense("Apache License\n Version 2.0, January 2004"), "Apache-2.0");
  assert.equal(detectLicense("GNU GENERAL PUBLIC LICENSE\n Version 3, 29 June 2007"), "GPL-3.0");
  assert.equal(detectLicense("Mozilla Public License Version 2.0"), "MPL-2.0");
  assert.equal(detectLicense("hello"), null);
});

test("BSD-3 is told apart from BSD-2", () => {
  const two = "Redistribution and use in source and binary forms, with or without modification";
  assert.equal(detectLicense(two), "BSD-2-Clause");
  assert.equal(detectLicense(`${two}. Neither the name of the copyright holder`), "BSD-3-Clause");
});

test("MIT with a matching package.json is clean", () => {
  assert.deepEqual(evaluateLicense(MIT, "MIT"), []);
});

test("mismatch with package.json is a warning", () => {
  const f = evaluateLicense(MIT, "Apache-2.0");
  assert.equal(f.length, 1);
  assert.equal(f[0].severity, "warn");
  assert.equal(f[0].file, "package.json");
});

test("non-open and copyleft licenses are reported", () => {
  assert.equal(evaluateLicense("Business Source License 1.1", null)[0].severity, "error");
  assert.equal(evaluateLicense("GNU GENERAL PUBLIC LICENSE\n Version 3", "GPL-3.0-only")[0].severity, "warn");
});

test("unknown text is a warning", () => {
  assert.equal(evaluateLicense("do what you want", null)[0].message.includes("not recognised"), true);
});

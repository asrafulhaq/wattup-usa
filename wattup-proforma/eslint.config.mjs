import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The vendored Site Pro-Forma Builder: plain browser scripts, byte-identical
    // to docs/Pro-Forma source/, and never edited here. Not this app's code.
    "private/**",
  ]),
  {
    // The engine, ported from private/tool/js/ so it can be bundled instead of
    // served as four script tags. The bodies of these three files are byte-identical
    // to the vendor source and must stay that way: tests/proforma/engine-parity.test.ts
    // renders both and fails on a single differing character. So the two rules that
    // would force an edit are off here, and only here.
    //
    // @ts-nocheck is deliberate: they carry no annotations, and their types are
    // hand-written alongside in model.d.ts, document.d.ts and evpin.d.ts.
    // The unused binding is a caught-and-ignored error in the vendor's own fetch guard.
    files: ["lib/proforma/*.js"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;

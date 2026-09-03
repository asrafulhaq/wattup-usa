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
  ]),

  // TipTap's UI templates, and the hooks shipped alongside them, are vendored
  // rather than written here — they use double quotes and no semicolons, unlike
  // every other file in this app, because they were copied from upstream.
  //
  // React 19's newer react-hooks rules flag patterns those templates depend on
  // to keep editor state in sync: setState inside an effect, and writing a ref
  // during render. Rewriting them would diverge from upstream, re-break on the
  // next template update, and risk subtle editor regressions that no test here
  // would catch — this app has no editor tests.
  //
  // So the three rules are scoped off for these paths ONLY. They stay enabled
  // everywhere else, including every file we write. If a file below is ever
  // genuinely rewritten as our own, take it out of this list.
  {
    files: [
      "components/tiptap-ui/**",
      "components/tiptap-ui-primitive/**",
      "hooks/use-composed-ref.ts",
      "hooks/use-element-rect.ts",
      "hooks/use-is-breakpoint.ts",
      "hooks/use-menu-navigation.ts",
      "hooks/use-tiptap-editor.ts",
      "hooks/use-unmount.ts",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
    },
  },
]);

export default eslintConfig;

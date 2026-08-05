import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // Allow console for dev logging in orchestrator (intentional)
    "no-console": "off",
    // Allow non-null assertions — DOM element refs are guaranteed by static JSX
    "@typescript-eslint/no-non-null-assertion": "off",
    // Allow explicit any in rare cases where third-party types are missing
    "@typescript-eslint/no-explicit-any": "off",
    // Allow unused vars with _ prefix (intentional pattern)
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    // React — relax rules that conflict with our imperative orchestrator pattern
    "react-hooks/exhaustive-deps": "off",
    "react-hooks/purity": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",
    // Next.js — allow img elements (we use inline SVGs, not next/image)
    "@next/next/no-img-element": "off",
    "@next/next/no-html-link-for-pages": "off",
  },
}, {
  ignores: [
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "examples/**",
    "skills/**",
    "tool-results/**",
    "tests/smoke-test.js",
  ],
}];

export default eslintConfig;

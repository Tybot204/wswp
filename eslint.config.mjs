import globals from "globals";
import pluginJs from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import tseslint from "typescript-eslint";

export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { ignores: ["**/build/**/*", "**/generated/**/*"] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  stylistic.configs.customize({
    braceStyle: "1tbs",
    quotes: "double",
    semi: true,
  }),
  {
    rules: {
      "max-len": ["error", { code: 120 }],
      "sort-imports": ["error", { allowSeparatedGroups: true }],
    },
  },
];

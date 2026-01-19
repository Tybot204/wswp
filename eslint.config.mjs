import eslint from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import perfectionist from "eslint-plugin-perfectionist";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  perfectionist.configs["recommended-alphabetical"],
  stylistic.configs.customize({
    braceStyle: "1tbs",
    quotes: "double",
    semi: true,
  }),
  { ignores: ["**/build/", "**/generated/"] },
  {
    plugins: { "@stylistic": stylistic },
    rules: {
      "@stylistic/max-len": ["error", { code: 120 }],
    },
  },
);

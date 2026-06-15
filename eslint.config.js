import vueTsEslintConfig from "@vue/eslint-config-typescript";
import pluginVue from "eslint-plugin-vue";

export default [
  { ignores: ["dist", "coverage", "node_modules", ".firebase"] },
  ...pluginVue.configs["flat/recommended"],
  ...vueTsEslintConfig(),
  {
    rules: {
      "vue/multi-word-component-names": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
];

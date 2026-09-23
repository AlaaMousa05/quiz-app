const base = require("../.eslintrc.base.cjs");

module.exports = {
  root: true,
  env: { node: true, es2022: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.eslint.json",
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint"],
  extends: base.extends,
  rules: base.rules,
  overrides: [
    {
      files: ["tests/**/*.ts"],
      rules: { "max-lines-per-function": "off" },
    },
  ],
};

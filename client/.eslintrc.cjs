const base = require("../.eslintrc.base.cjs");

module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.eslint.json",
    tsconfigRootDir: __dirname,
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  extends: [
    ...base.recommendedExtends,
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    base.prettierExtend,
  ],
  settings: { react: { version: "detect" } },
  rules: {
    ...base.rules,
    "react/react-in-jsx-scope": "off",
  },
};

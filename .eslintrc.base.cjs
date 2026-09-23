const recommendedExtends = ["eslint:recommended", "plugin:@typescript-eslint/recommended"];
const prettierExtend = "eslint-config-prettier";

module.exports = {
  recommendedExtends,
  prettierExtend,
  extends: [...recommendedExtends, prettierExtend],
  rules: {
    "max-lines": ["warn", 200],
    "max-lines-per-function": ["warn", 40],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  },
};

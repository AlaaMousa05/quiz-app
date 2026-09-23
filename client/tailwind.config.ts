import type { Config } from "tailwindcss";

// Logical properties only — no left/right utilities — so layouts stay RTL-safe
// (constitution Principle IV/V, CLAUDE.md's RTL-safe rule).
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  corePlugins: {
    float: false,
    clear: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;

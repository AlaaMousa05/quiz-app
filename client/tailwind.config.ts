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
    extend: {
      // Design tokens from specs/001-quiz-app-core/ui.md §1.1 (contrast-checked
      // against white / their own background pairing).
      colors: {
        neutral: {
          0: "#FFFFFF",
          50: "#F7F8FA",
          100: "#EEF0F3",
          300: "#C9CED6",
          500: "#6B7280",
          700: "#374151",
          900: "#111318",
        },
        accent: {
          100: "#E3E9FB",
          600: "#3454D1",
          700: "#28409C",
        },
        success: {
          100: "#DCFCE7",
          700: "#15803D",
        },
        warning: {
          100: "#FEF3C7",
          700: "#B45309",
        },
        danger: {
          100: "#FEE2E2",
          700: "#B91C1C",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

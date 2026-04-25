import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        glass: "rgba(255,255,255,0.6)",
        "apple-gray": "#f5f5f7",
        "apple-dark": "#1d1d1f",
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
        },
        navy: {
          700: "#1e3a5f",
          800: "#162d4a",
          900: "#0f1f35",
        },
      },
      backdropBlur: {
        glass: "20px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.12)",
        card: "0 2px 16px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;

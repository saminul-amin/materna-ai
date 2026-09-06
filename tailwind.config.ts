import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fbfa",
          100: "#d3f3f0",
          200: "#a8e6e1",
          300: "#73d3cd",
          400: "#3fb8b2",
          500: "#1f9c98",
          600: "#177d7b",
          700: "#166463",
          800: "#165050",
          900: "#154343",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;

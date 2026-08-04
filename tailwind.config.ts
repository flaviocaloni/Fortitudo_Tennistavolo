import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palette dal logo Fortitudo Busnago
        navy: {
          50: "#f0f4fa",
          100: "#dce5f2",
          200: "#b8cbe4",
          500: "#2e4d80",
          600: "#24406e",
          700: "#1d3459",
          800: "#16294a",
          900: "#101f39",
        },
        crimson: {
          50: "#fbeeed",
          100: "#f7d9d7",
          500: "#d04437",
          600: "#c0392b",
          700: "#a52f23",
          800: "#8a2118",
        },
        cream: "#f5f0e6",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef9f1",
          100: "#d6f0dd",
          200: "#aee0bd",
          300: "#7ccb95",
          400: "#4cb06d",
          500: "#2b9550",
          600: "#1d783f",
          700: "#185f34",
          800: "#154c2c",
          900: "#123f26",
        },
      },
    },
  },
  plugins: [],
};

export default config;

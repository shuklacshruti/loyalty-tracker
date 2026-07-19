import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF7F0",
        ink: "#1C1B19",
        stamp: "#C41E3A",
        kraft: "#E8D9B5",
        success: "#2F6B4F",
        muted: "#8A8478",
        line: "#E4DFD3",
      },
      fontFamily: {
        mono: ["'Space Mono'", "monospace"],
        display: ["'Archivo Black'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

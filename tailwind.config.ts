import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        quicksand: ["Quicksand", "sans-serif"],
      },
      colors: {
        pink: {
          50:  "#FFF0F5",
          100: "#FFE4EE",
          200: "#FFCCD9",
          300: "#FFB6C1",
          400: "#FF91AA",
          500: "#FF69B4",
          600: "#FF1493",
          700: "#DB0A7B",
          800: "#B0065F",
          900: "#8A0449",
        },
        blush:   "#FFF0F5",
        bubblegum: "#FFB6C1",
        hotpink:   "#FF69B4",
      },
      boxShadow: {
        cute:   "0 4px 20px rgba(255, 105, 180, 0.15)",
        "cute-lg": "0 8px 40px rgba(255, 105, 180, 0.20)",
        "cute-xl": "0 16px 60px rgba(255, 105, 180, 0.25)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%":       { transform: "rotate(2deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":       { transform: "translateY(-6px)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":       { opacity: "0.7", transform: "scale(1.1)" },
        },
      },
      animation: {
        wiggle:  "wiggle 1s ease-in-out infinite",
        float:   "float 3s ease-in-out infinite",
        sparkle: "sparkle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

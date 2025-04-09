
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        'background': '#ffffff',
        'background-g': '#f7f7f7',
        primary: {
          DEFAULT: "#6d3666",
          light: "#8a4683",
          dark: "#502849",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#fec948",
          light: "#fed470",
          dark: "#febb20",
          foreground: "#03032c",
        },
        light: "#dcdde2",
        dark: "#03032c",
        info: "#f09432",
        accent: {
          1: "#30445a",
          2: "#0273ba",
          3: "#a6a8ad",
        },
        success: "#16C172",
        warning: "#FFDE00",
        danger: "#F8736E",
        neutral: {
          50: "#f8f9fa",
          100: "#f1f3f5",
          200: "#e9ecef",
          300: "#dee2e6",
          400: "#ced4da",
          500: "#adb5bd",
          600: "#868e96",
          700: "#495057",
          800: "#343a40",
          900: "#212529",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#212529",
        },
      },
      fontFamily: {
        sans: ["SF Pro Display", "Inter", "sans-serif"],
      },
      boxShadow: {
        'apple': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'apple-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #6d3666 0%, #8a4683 100%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

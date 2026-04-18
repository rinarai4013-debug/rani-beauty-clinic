import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "rani-navy": "#0F1D2C",
        "rani-navy-light": "#1A2A3C",
        "rani-gold": "#C9A96E",
        "rani-gold-accessible": "#8E6A2D",
        "rani-gold-light": "#D4B87A",
        "rani-gold-dark": "#B8944F",
        "rani-cream": "#FAF8F5",
        "rani-text": "#2A2A2A",
        "rani-muted": "#6B7280",
        "rani-border": "#E5E7EB",
        "rani-success": "#059669",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Playfair Display", "serif"],
        body: ["var(--font-body)", "Montserrat", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "underline-in": "underlineIn 0.3s ease-out forwards",
        "shimmer": "shimmer 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(201, 169, 110, 0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(201, 169, 110, 0.4)" },
        },
        underlineIn: {
          from: { width: "0" },
          to: { width: "100%" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

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
        temple: {
          gold: "#C5973E",
          "gold-light": "#E8D5A3",
          "gold-dark": "#9B7730",
          red: "#B91C32",
          "red-dark": "#7A1020",
          saffron: "#E85D04",
          cream: "#FDF6E3",
          "cream-dark": "#F5EACD",
          maroon: "#4A0818",
          "maroon-deep": "#2D0510",
          ivory: "#FFFEF9",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Georgia", "serif"],
        accent: ["var(--font-accent)", "Georgia", "serif"],
        body: ["system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        "premium": "0 4px 20px -2px rgba(197, 151, 62, 0.15), 0 2px 8px -2px rgba(0,0,0,0.08)",
        "premium-lg": "0 8px 40px -4px rgba(197, 151, 62, 0.2), 0 4px 16px -4px rgba(0,0,0,0.1)",
        "gold-glow": "0 0 20px rgba(197, 151, 62, 0.3)",
        "gold-glow-lg": "0 0 40px rgba(197, 151, 62, 0.25), 0 0 80px rgba(197, 151, 62, 0.1)",
        "inner-gold": "inset 0 2px 4px rgba(232, 213, 163, 0.15)",
      },
      backgroundImage: {
        "gold-shimmer": "linear-gradient(110deg, transparent 33%, rgba(197,151,62,0.08) 50%, transparent 67%)",
        "gold-radial": "radial-gradient(ellipse at center, rgba(197,151,62,0.1) 0%, transparent 70%)",
      },
    },
  },
  plugins: [],
};
export default config;

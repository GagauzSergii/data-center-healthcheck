/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        // Corporate light theme palette
        surface: {
          DEFAULT: "#f4f5f7",
          card: "#ffffff",
          border: "#e2e4e9",
        },
        accent: {
          lime: "#c8f000",      // globe glow color from reference
          green: "#22c55e",
          red: "#ef4444",
        },
        text: {
          primary: "#0f1117",
          secondary: "#5c6270",
          muted: "#9aa0ad",
        },
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
        "glass-lg": "0 20px 60px rgba(0,0,0,0.12)",
      },
      animation: {
        "pulse-fast": "pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

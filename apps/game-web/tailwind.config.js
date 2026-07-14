/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2F80ED",
        secondary: "#FF6B00",
        background: "#0F172A",
        surface: "#1E293B",
        success: "#22C55E",
        danger: "#EF4444",
        text: "#F8FAFC",
        textMuted: "#94A3B8",
        border: "#334155"
      },
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 15px rgba(47, 128, 237, 0.4)",
        glowOrange: "0 0 15px rgba(255, 107, 0, 0.4)"
      }
    },
  },
  plugins: [],
}

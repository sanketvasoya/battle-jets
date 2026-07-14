/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2F80ED",
        secondary: "#FF6B00",
        background: "#0F172A",
        surface: "#1E293B",
        success: "#22C55E",
        danger: "#EF4444",
        border: "#334155",
        textMuted: "#94A3B8",
      },
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

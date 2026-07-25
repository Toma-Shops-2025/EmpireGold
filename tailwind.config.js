/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#8b5cf6", // Purple
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#facc15", // Gold
          foreground: "#000000",
        },
        background: "#02020a",
      },
      dropShadow: {
        glow: [
          "0 0 20px rgba(139, 92, 246, 0.4)",
          "0 0 65px rgba(139, 92, 246, 0.2)"
        ]
      }
    },
  },
  plugins: [],
}

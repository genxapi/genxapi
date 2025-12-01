/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,md,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1E4AF5",
        primarySoft: "#5FA9FF",
        navy: "#0C1224",
        accent: "#1BB36F",
        muted: "#5D6682",
        surface: "#F4F7FF",
        border: "#E3E7F2"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["DM Mono", "SFMono-Regular", "Menlo", "monospace"]
      }
    }
  },
  plugins: []
};

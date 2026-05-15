/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["media"],
  theme: {
    extend: {
      colors: {
        "tool-bg": "var(--xds-tool-bg)",
        "tool-surface": "var(--xds-tool-surface)",
        "tool-elevated": "var(--xds-tool-elevated)",
        "tool-border": "var(--xds-tool-border)",
        "tool-text": "var(--xds-tool-text)",
        "tool-muted": "var(--xds-tool-text-muted)",
        "tool-primary": "var(--xds-tool-primary)",
        "tool-primary-hover": "var(--xds-tool-primary-hover)",
        "tool-success": "var(--xds-tool-success)",
        "tool-warning": "var(--xds-tool-warning)",
        "tool-danger": "var(--xds-tool-danger)",
      },
      fontFamily: {
        sans: ["Pretendard", "Inter", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "var(--xds-tool-radius)",
      },
    },
  },
  plugins: [],
};

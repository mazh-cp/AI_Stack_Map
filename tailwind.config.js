/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Cool, professional palette ──
        // Background: Soft Alabaster #F9FAFB · Card: Cool Gray #F3F4F6
        // Text/Accent: Slate #374151 · CTA: Teal #4EB5A9
        //
        // `white` is remapped to a strong slate so the app's many `text-white`
        // headings become dark-on-light automatically; the gray scale is
        // inverted (low index = darkest) so `text-gray-*` stays legible.
        white: "#1F2937",
        black: "#0F172A", // used only for soft shadows / modal overlays
        // Inverted scale tuned for legibility on the light background —
        // every shade used as text stays >= ~3.6:1 contrast on #F9FAFB.
        gray: {
          200: "#374151", // primary text (the scheme's text color)
          300: "#434c59",
          400: "#515b69",
          500: "#5d6675", // labels / descriptions
          600: "#6b7280", // secondary (was too light)
          700: "#7c8694", // faintest text still readable
        },
        base: {
          bg: "#F9FAFB", // 60% dominant — soft alabaster
          card: "#F3F4F6", // 30% structural — cool gray
          sidebar: "#F3F4F6",
          border: "#E5E7EB",
          hover: "#E9EBEF",
        },
        accent: {
          DEFAULT: "#4EB5A9", // CTA — slate green / teal
          soft: "#3E9488",
        },
        status: {
          critical: "#C2453F", // red
          warning: "#C8902E", // amber
          success: "#3E9B74", // green (distinct from the teal CTA)
          info: "#4E7FB5", // slate blue
          violet: "#556377", // slate (OWASP badges — darkened for contrast)
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        soc: {
          primary: "#4EB5A9", // teal CTA
          secondary: "#64748B", // slate
          accent: "#3E9B74", // green
          neutral: "#E5E7EB",
          "base-100": "#F9FAFB",
          "base-200": "#F3F4F6",
          "base-300": "#F3F4F6",
          info: "#4E7FB5",
          success: "#3E9B74",
          warning: "#C8902E",
          error: "#C2453F",
        },
      },
    ],
    darkTheme: "soc",
  },
};

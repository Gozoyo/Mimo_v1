import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF7F0",
        ink: "#2F322D",
        muted: "#777A70",
        leaf: "#6F8F72",
        moss: "#DDE8CE",
        sun: "#F2D58A",
        coral: "#DFA08D",
        lavender: "#E7E3EC"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(47, 50, 45, 0.10)"
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
} satisfies Config;

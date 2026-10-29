/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: token("background"),
        surface: token("surface"),
        "surface-muted": token("surface-muted"),
        border: token("border"),
        foreground: token("foreground"),
        muted: token("muted"),
        primary: token("primary"),
        "primary-soft": token("primary-soft"),
        positive: token("positive"),
        negative: token("negative"),
        warning: token("warning"),
      },
    },
  },
  plugins: [],
};

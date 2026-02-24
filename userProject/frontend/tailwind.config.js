/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6FA3B3",
        primaryDark: "#4F8C9D",
        lightBg: "#EAF3F6",
        softGray: "#F5F7F8",
        darkText: "#1F2D3D"
      },
    },
  },
  plugins: [],
}

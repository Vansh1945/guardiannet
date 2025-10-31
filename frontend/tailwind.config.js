/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2C3E50",
        'primary-dark': "#1A2634", // 20% darker than primary
        'primary-light': "#3D5166", // 20% lighter than primary
        secondary: "#3498DB",
        'secondary-dark': "#2980B9", // 10% darker than secondary
        background: "#F5F7FA",
        text: "#333333",
      }
    },
  },
  plugins: [],
};
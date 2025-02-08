/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js", // Add Flowbite paths
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('flowbite/plugin'), // Include Flowbite plugin
  ],
};

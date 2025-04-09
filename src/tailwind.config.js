/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#3B82F6', // blue-500
            light: '#93C5FD',   // blue-300
            dark: '#1E40AF',    // blue-800
          },
          secondary: {
            DEFAULT: '#10B981', // emerald-500
            light: '#6EE7B7',   // emerald-300
            dark: '#065F46',    // emerald-800
          },
        },
      },
    },
    plugins: [],
  }
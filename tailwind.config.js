/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable manual dark mode toggling via 'dark' class
    theme: {
        extend: {
            fontFamily: {
                chinese: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji'],
            },
        },
    },
    plugins: [],
}

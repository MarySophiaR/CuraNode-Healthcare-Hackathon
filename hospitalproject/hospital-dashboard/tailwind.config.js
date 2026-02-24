/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    safelist: [
        'bg-primary', 'bg-primaryDark', 'bg-lightBg', 'bg-softGray',
        'text-primary', 'text-primaryDark', 'text-darkText',
        'border-primary', 'border-primaryDark',
        'hover:bg-primary', 'hover:bg-primaryDark', 'hover:text-white',
        'shadow-primary', 'ring-primary',
        'from-primary', 'to-primaryDark',
        'focus:ring-primary',
    ],
    theme: {
        extend: {
            colors: {
                primary: 'rgb(var(--color-primary) / <alpha-value>)',
                primaryDark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
                lightBg: 'rgb(var(--color-bg-light) / <alpha-value>)',
                softGray: 'rgb(var(--color-bg-soft) / <alpha-value>)',
                darkText: 'rgb(var(--color-text-dark) / <alpha-value>)',
            },
        },
    },
    plugins: [],
}

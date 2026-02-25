/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: '#6a57e3',
          'primary-light': '#ddd8ff',
          accent: '#222834',
          'accent-light': '#3b3f4a',
          pink: '#cd74dd',
          'pink-light': '#d995e5',
          base: '#ffffff',
        },
        fontFamily: {
          sans: ['Quicksand', 'sans-serif'],
          quicksand: ['Quicksand', 'sans-serif'], 
        },
        borderRadius: {
          DEFAULT: '1rem',  // equivale a xl
        },
        spacing: {
          'lg': '2rem',
          'xl': '3rem',
        },
      },
    },
    plugins: [],
    //prefix: 'tw-'
  }
  
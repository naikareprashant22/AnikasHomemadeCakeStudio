/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        blush:     '#F4A7B9',
        deeprose:  '#C2185B',
        gold:      '#D4A843',
        cream:     '#FFF8F0',
        choco:     '#3E1F00',
      },
      fontFamily: {
        playfair:   ['"Playfair Display"', 'serif'],
        cormorant:  ['"Cormorant Garamond"', 'serif'],
        lato:       ['Lato', 'sans-serif'],
        dancing:    ['"Dancing Script"', 'cursive'],
      },
    },
  },
  plugins: [],
};

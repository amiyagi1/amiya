module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        omio: '#010101',
        nft: '#e5e7eb',
        amiya: 'hsla(192, 18%, 49%, 1)'
      },
      fontFamily: {
        omiofont1: ["PPMonumentExtended-Black", "sans-serif"],
        omiofont2: ["PPMonumentExtended-Regular", "sans-serif"],
        omiofont3: ["PPMonumentExtended-Light", "sans-serif"],
      },
      screens: {
        'sm':  '640px',
        'md':  '768px',
        'lg':  '1024px',
        'xl':  '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [
    // tailwind-scrollbar-hide replaced with inline plugin
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
      });
    },
  ],
};
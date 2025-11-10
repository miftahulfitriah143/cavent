/** @type {import('tailwindcss').Config} */
module.exports = {
  // Mengaktifkan dark mode berdasarkan keberadaan kelas 'dark' di elemen HTML
  darkMode: 'class', // <--- TAMBAHKAN BARIS INI
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}', // Pastikan ini mencakup semua file Anda
  ],
  theme: {
    extend: {
      // Anda bisa menambahkan custom colors, fonts, dll. di sini
    },
  },
  plugins: [],
};

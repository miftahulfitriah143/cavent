// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com',       // Untuk gambar profil dari Cloudinary
      'lh3.googleusercontent.com', // Untuk gambar profil dari Google OAuth
      'drive.google.com',         // <-- TAMBAHKAN INI untuk gambar event dari Google Drive
      'fonts.googleapis.com', // Contoh domain lain jika diperlukan oleh font atau resource lain
      'cdn.tailwindcss.com', // Tambahkan jika menggunakan Tailwind CDN (walaupun biasanya tidak perlu untuk gambar)
      'placehold.co', // Jika Anda menggunakan placeholder.co], // Tambahkan domain Cloudinary Anda di sini
    ]
  },
};

module.exports = nextConfig;
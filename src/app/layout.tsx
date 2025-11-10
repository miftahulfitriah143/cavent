// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import AuthProvider from './providers/auth-provider'; // AuthProvider untuk NextAuth.js
import ThemeProvider from './providers/theme-provider'; // <--- Import ThemeProvider Anda

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Cavent',
  description: 'Temukan event kampus impian Anda!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${poppins.className} antialiased relative bg-gradient-to-br from-[#ffffff] to-[#ffffff] text-black min-h-screen`}
      >
        {/* Abstract Background Effect (tetap di body) */}
        <div
          className="absolute inset-0 z-0 opacity-40 overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at top right, #D0EBF4, transparent), radial-gradient(circle at bottom left, #D0EBF4, transparent)',
          }}
        ></div>

        {/* Konten utama di atas background, dibungkus ThemeProvider dan AuthProvider */}
        <div className="relative z-10 w-full min-h-screen flex flex-col">
          <ThemeProvider> {/* <--- Bungkus dengan ThemeProvider */}
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}

// src/app/components/Navbar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { FaUserCircle } from 'react-icons/fa'; // Import ikon user dari react-icons/fa

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-6 bg-[#D0EBF4]/70 backdrop-blur-md shadow-md">
      {/* Logo (Left) */}
      <div className="flex items-center">
        <Link href="/">
          <Image
            src="/caventlogo.svg"
            alt="Cavent Logo"
            width={120}
            height={120}
            priority
          />
        </Link>
      </div>

      {/* Center Nav Links */}
      <div className="flex items-center space-x-8 text-black">
        <Link href="/" className="hover:text-[#1e7a9e] transition-colors duration-300">Home</Link>
        <Link href="/event" className="hover:text-[#1e7a9e] transition-colors duration-300">Events</Link>

        {/* Link My Events (untuk Organizer/Admin) - DIKONSOLIDASI DI SINI */}
        {status === 'authenticated' && ((session?.user as any)?.role === 'ORGANIZER' || (session?.user as any)?.role === 'ADMIN') && (
          <Link href="/my-events" className="hover:text-[#1e7a9e] transition-colors duration-300">
            Event Saya
          </Link>
        )}
      </div>

      {/* Right Nav Links (Conditional) */}
      <div className="flex items-center space-x-6">
        {status === 'loading' && (
          // Indikator loading sesi - disesuaikan ukurannya
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
        )}
        {status === 'authenticated' ? (
          <Link href="/profile">
            {session.user?.image ? (
              // Tampilkan gambar profil jika ada
              <Image
                src={session.user.image}
                alt={session.user?.name || 'User Avatar'}
                width={40}
                height={40}
                className="rounded-full border-2 border-gray-300 object-cover cursor-pointer hover:border-[#2596BE] transition-colors duration-300"
              />
            ) : (
              // Tampilkan ikon user jika tidak ada gambar profil
              <FaUserCircle 
                className="w-10 h-10 text-gray-600 rounded-full border-2 border-gray-300 cursor-pointer hover:text-[#2596BE] hover:border-[#2596BE] transition-colors duration-300"
                aria-label="Profile" // Untuk aksesibilitas
              />
            )}
          </Link>
        ) : (
          <>
            {/* Tampilan sebelum login */}
            <Link href="/login" className="hover:text-[#1e7a9e] text-black transition-colors duration-300">Login</Link>
            <Link href="/register">
              <button className="bg-[#2596BE] text-white px-6 py-2 rounded-md hover:bg-[#1e7a9e] transition-colors duration-300">
                Register
              </button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

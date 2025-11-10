// components/Footer.tsx
'use client';
import React from 'react';
import { FaFacebookF, FaLinkedinIn, FaYoutube, FaInstagram } from 'react-icons/fa';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    // Apply the background classes here
    <footer className="relative px-12 py-14 bg-gradient-to-br from-[#ffffff] to-[#ffffff] text-black">
      {/* Abstract Background Effect for the Footer */}
      {/* This ensures the glow effect is specifically within the footer's bounds */}
      <div className="absolute inset-0 z-0 opacity-40 overflow-hidden"
           style={{
             background: 'radial-gradient(circle at top right, #D0EBF4, transparent), radial-gradient(circle at bottom left, #D0EBF4, transparent)',
           }}
      ></div>

      {/* Content Wrapper for Z-index */}
      {/* Wrap your footer content in a div with a higher z-index */}
      <div className="relative z-10">
        <div className="w-full h-px bg-gray-300 mb-6"></div> {/* New line added */}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href="/" className="font-bold text-lg text-black hover:text-[#2596BE] transition-colors duration-200">
            Cavent
          </Link>
          <div className="flex gap-4 text-gray-500 text-xl">
            <a href="#" aria-label="Facebook" className="hover:text-[#2596BE] transition-colors duration-200"><FaFacebookF /></a>
            <a href="#" aria-label="LinkedIn" className="hover:text-[#2596BE] transition-colors duration-200"><FaLinkedinIn /></a>
            <a href="#" aria-label="YouTube" className="hover:text-[#2596BE] transition-colors duration-200"><FaYoutube /></a>
            <a href="#" aria-label="Instagram" className="hover:text-[#2596BE] transition-colors duration-200"><FaInstagram /></a>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-16">
          Copyright © 2025 - Cavent. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
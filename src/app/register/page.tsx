'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import Navbar from '../components/Navbar'; // Pastikan jalur ini benar
import Footer from '../components/Footer'; // Pastikan jalur ini benar
import { signIn } from 'next-auth/react'; // Import signIn function dari next-auth/react

export default function RegisterPage() {
  const [name, setName] = useState(''); // State untuk nama (sesuai schema.prisma)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fungsi untuk menangani submit formulir registrasi email/password
  const handleCredentialRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Mencegah refresh halaman
    setLoading(true);
    setError(null); // Reset pesan error

    // Validasi Password Match
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      setLoading(false);
      return;
    }

    try {
      // Panggil API registrasi custom di backend
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Kirim 'name', 'email', 'password', dan role 'USER'
        body: JSON.stringify({ name, email, password, role: 'USER' }), // role akan ditentukan ulang di backend
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Tangani pesan error spesifik dari backend (misalnya, email sudah terdaftar)
        throw new Error(errorData.message || 'Registration failed. Please try again.');
      }

      // Jika registrasi berhasil
      const data = await response.json();
      console.log('Registration successful:', data);
      alert('Registration successful! You can now log in.');

      // Redirect ke halaman login setelah registrasi berhasil
      router.push('/login');

    } catch (err: any) {
      console.error('Registration error:', err.message);
      setError(err.message); // Tampilkan error dari backend atau error umum
    } finally {
      setLoading(false); // Selesai loading
    }
  };

  // Fungsi untuk menangani login/registrasi dengan Google OAuth
  const handleGoogleRegister = () => {
    signIn('google', { callbackUrl: '/home' }); // Arahkan ke /home atau /event setelah registrasi/login Google
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <Navbar />

      <main className="flex flex-col items-center justify-center flex-1 px-4 py-8 
                       min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-80px)]">
        <div className="bg-white border border-[#2596BE] rounded-lg p-8 w-full max-w-md text-center shadow-md">
          <h2 className="text-2xl text-[#2596BE] font-bold mb-6">Create Your Cavent Account!</h2>
          
          {/* Formulir Registrasi Email/Password */}
          <form className="flex flex-col gap-4" onSubmit={handleCredentialRegister}>
            <input
              type="text" // Menggunakan type="text" untuk nama/username
              id="name"
              name="name"
              placeholder="Full Name"
              className="border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2596BE]"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              className="border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2596BE]"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              className="border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2596BE]"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              id="confirm-password"
              name="confirm-password"
              placeholder="Confirm Password"
              className="border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2596BE]"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
              type="submit"
              className="bg-[#2596BE] text-white py-2 rounded-full font-semibold hover:bg-[#1e7a9e] transition-colors duration-300"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register Account'}
            </button>
          </form>

          <p className="text-sm mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Login here
            </Link>
          </p>

          <p className="my-4 text-sm text-gray-500">or</p>

          {/* Tombol Register dengan Google */}
          <button
            onClick={handleGoogleRegister} // Panggil fungsi handleGoogleRegister
            className="flex items-center justify-center gap-2 border border-gray-300 px-4 py-2 rounded-md w-full hover:bg-gray-100 transition"
          >
            <FcGoogle className="text-xl" />
            <span className="font-medium">Sign up with Google</span>
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
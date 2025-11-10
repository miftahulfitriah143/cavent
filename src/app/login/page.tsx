'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Tetap gunakan useRouter untuk redirect manual setelah form
import { FcGoogle } from 'react-icons/fc';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { signIn } from 'next-auth/react'; // Import signIn function

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCredentialLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Panggil signIn dari NextAuth.js dengan provider 'credentials'
    // `redirect: false` mencegah NextAuth.js melakukan redirect otomatis,
    // sehingga kita bisa menangani redirect secara manual dan menampilkan error.
    const result = await signIn('credentials', {
      redirect: false, // Penting untuk menangani redirect dan error secara manual
      email,
      password,
    });

    setLoading(false);

    if (result?.error) {
      // Jika ada error dari NextAuth.js (misalnya, 'CredentialsSignin' jika authorize mengembalikan null)
      setError(result.error || 'Login failed. Please check your credentials.');
      console.error('Credential login error:', result.error);
    } else if (result?.ok) {
      // Jika login berhasil
      alert('Login successful! Welcome back.');
      router.push('/home'); // Arahkan ke halaman beranda atau dashboard setelah login
    } else {
        setError('An unexpected error occurred during login.');
    }
  };

  const handleGoogleLogin = () => {
    // Panggil signIn dari NextAuth.js dengan provider 'google'
    signIn('google', { callbackUrl: '/home' }); // Ganti '/event' jadi '/home' untuk konsistensi
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex flex-col items-center justify-center flex-1 px-4 py-8
                       min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-80px)]">
        <div className="bg-white border border-[#2596BE] rounded-lg p-8 w-full max-w-md text-center shadow-md">
          <h2 className="text-2xl text-[#2596BE] font-bold mb-6">Hi, Welcome Back Venters!</h2>

          {/* Formulir Login Email/Password */}
          <form className="flex flex-col gap-4" onSubmit={handleCredentialLogin}>
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
              type="submit"
              className="bg-[#2596BE] text-white py-2 rounded-full font-semibold hover:bg-[#1e7a9e] transition-colors duration-300"
              disabled={loading}
            >
              {loading ? 'Logging In...' : 'Login'}
            </button>
          </form>

          <p className="mt-4 text-sm">
            Doesn’t have an account?{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>

          <p className="my-4 text-sm text-gray-500">or</p>

          {/* Tombol Login dengan Google */}
          <button
            onClick={handleGoogleLogin} // Panggil fungsi handleGoogleLogin
            className="flex items-center justify-center gap-2 border border-gray-300 px-4 py-2 rounded-md w-full hover:bg-gray-100 transition"
          >
            <FcGoogle className="text-xl" />
            <span className="font-medium">Sign in with Google</span>
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
// src/app/profile/page.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react'; // Import useState
import Image from 'next/image';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaUserCircle, FaUpload } from 'react-icons/fa'; // Import FaUpload icon

export default function ProfilePage() {
  const { data: session, status, update } = useSession(); // Tambahkan 'update' dari useSession
  const router = useRouter();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadError(null);
      setUploadSuccess(null);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !session?.user?.id) {
      setUploadError('Please select a file first or ensure you are logged in.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('avatar', selectedFile); // 'avatar' harus sesuai dengan nama field di backend

    try {
      const response = await fetch('/api/profile/upload-avatar', {
        method: 'POST',
        body: formData, // fetch akan otomatis set Content-Type header untuk FormData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload image.');
      }

      const data = await response.json();
      setUploadSuccess('Profile picture updated successfully!');
      setSelectedFile(null); // Reset input file

      // Perbarui sesi di frontend agar gambar avatar langsung berubah
      // NextAuth.js menyediakan fungsi `update` untuk memperbarui sesi
      await update({ image: data.imageUrl }); // Perbarui hanya properti 'image'

    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };


  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-[#2596BE]">Loading profile...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-red-500">Error: User data not found. Please try logging in again.</p>
        <div className="mt-4">
          <Link href="/login" className="text-blue-600 hover:underline">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex flex-col items-center justify-center flex-1 px-4 py-8">
        <div className="bg-white border border-[#2596BE] rounded-lg p-8 w-full max-w-md text-center shadow-md">
          <h2 className="text-3xl text-[#2596BE] font-bold mb-6">Your Profile</h2>

          <div className="mb-4">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt="Profile Picture"
                width={128}
                height={128}
                className="rounded-full mx-auto border-4 border-[#2596BE] object-cover"
              />
            ) : (
              <FaUserCircle
                className="w-32 h-32 text-gray-600 mx-auto rounded-full border-4 border-[#2596BE]"
                aria-label="Profile"
              />
            )}
          </div>

          {/* Form Upload Avatar */}
          <div className="mt-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Change Profile Picture</h3>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#2596BE] hover:file:bg-blue-100"
            />
            {selectedFile && (
              <p className="text-sm text-gray-600 mb-2">Selected: {selectedFile.name}</p>
            )}

            {uploading && (
              <p className="text-blue-500 text-sm mb-2">Uploading...</p>
            )}
            {uploadError && (
              <p className="text-red-500 text-sm mb-2">{uploadError}</p>
            )}
            {uploadSuccess && (
              <p className="text-green-500 text-sm mb-2">{uploadSuccess}</p>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="bg-[#2596BE] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#1e7a9e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full"
            >
              <FaUpload /> {uploading ? 'Uploading...' : 'Upload Picture'}
            </button>
          </div>

          <div className="text-left space-y-3 mt-8">
            <p className="text-lg">
              <span className="font-semibold text-gray-700">Name:</span> {session.user.name || 'N/A'}
            </p>
            <p className="text-lg">
              <span className="font-semibold text-gray-700">Email:</span> {session.user.email || 'N/A'}
            </p>
            <p className="text-lg">
              <span className="font-semibold text-gray-700">Role:</span> {(session.user as any).role || 'N/A'}
            </p>
          </div>

          <div className="mt-8">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="bg-red-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
// src/app/my-events/registrations/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '../../../components/Navbar'; // Sesuaikan path
import Footer from '../../../components/Footer'; // Sesuaikan path
import Link from 'next/link';

// Definisikan tipe untuk data pendaftar
interface Participant {
  registrationId: string;
  registeredAt: string; // Atau Date jika Anda ingin mengolah objek Date
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function EventRegistrationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { slug } = useParams(); // Ambil slug dari URL

  const [eventTitle, setEventTitle] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect jika tidak login atau tidak diizinkan
  useEffect(() => {
    if (status === 'loading') return;
    
    // Jika tidak terautentikasi, arahkan ke login
    if (status === 'unauthenticated') {
      router.push('/login');
    } 
    // Jika terautentikasi tapi bukan organizer atau admin, arahkan ke home
    else if ((session?.user as any)?.role !== 'ORGANIZER' && (session?.user as any)?.role !== 'ADMIN') {
      alert('Anda tidak memiliki izin untuk melihat daftar pendaftar.');
      router.push('/');
    }
  }, [session, status, router]);

  // Fetch data pendaftar event
  useEffect(() => {
    if (!slug || status !== 'authenticated') return; // Hanya fetch jika slug ada dan user login

    const fetchParticipants = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/events/${slug}/registrations`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Gagal memuat daftar pendaftar.');
        }
        const data = await response.json();
        setEventTitle(data.eventTitle);
        setParticipants(data.participants);
      } catch (err: any) {
        console.error('Error fetching participants:', err);
        setError(err.message || 'Tidak dapat memuat daftar pendaftar event ini.');
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [slug, status]); // Re-fetch jika slug atau status auth berubah

  // Tampilkan loading/akses ditolak
  if (loading || status === 'loading' || (status === 'authenticated' && (session?.user as any)?.role !== 'ORGANIZER' && (session?.user as any)?.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-lg text-[#2596BE]">
            {loading || status === 'loading' ? 'Memuat daftar pendaftar...' : 'Akses Ditolak'}
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 text-center">
          <p className="text-xl text-red-600 mb-4">{error}</p>
          <Link href="/my-events" className="bg-[#2596BE] text-white px-6 py-3 rounded-full hover:bg-[#1e7a9e] transition-colors">
            Kembali ke Event Saya
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Pendaftar Event: {eventTitle}</h1>

        <div className="mb-8">
            <Link href="/my-events" className="text-[#2596BE] hover:underline flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Kembali ke Event Saya
            </Link>
        </div>

        {participants.length > 0 ? (
          <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal Daftar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants.map((participant) => (
                  <tr key={participant.registrationId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {participant.user.name || 'Nama Tidak Tersedia'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {participant.user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(participant.registeredAt).toLocaleDateString('id-ID', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center text-gray-600 text-lg py-20 min-h-[300px]">
            <p>Belum ada pendaftar untuk event ini.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

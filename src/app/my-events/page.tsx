// src/app/my-events/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { FaEdit, FaTrashAlt, FaPlusCircle, FaUsers } from 'react-icons/fa'; // Import FaUsers ikon

// Definisikan tipe untuk Event yang akan datang dari API
interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  date: string;
  time: string;
  location: string;
  price: string;
  slug: string;
  organizerId: string; // Penting untuk otorisasi di frontend
}

export default function MyEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Redirect jika tidak login atau bukan organizer/admin
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if ((session?.user as any)?.role !== 'ORGANIZER' && (session?.user as any)?.role !== 'ADMIN') {
      alert('Anda tidak memiliki izin untuk mengelola event. Mengarahkan ke beranda.');
      router.push('/');
    }
  }, [session, status, router]);

  // Fetch event yang dibuat oleh user ini
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && ((session?.user as any)?.role === 'ORGANIZER' || (session?.user as any)?.role === 'ADMIN')) {
      const fetchMyEvents = async () => {
        try {
          setLoading(true);
          setError(null);
          setFeedbackMessage(null);

          const response = await fetch(`/api/events/my-events`);
          if (!response.ok) {
            throw new Error('Gagal memuat event Anda.');
          }
          const data: Event[] = await response.json();
          setMyEvents(data);
        } catch (err: any) {
          console.error('Error fetching my events:', err);
          setError(err.message || 'Tidak dapat memuat event Anda.');
        } finally {
          setLoading(false);
        }
      };
      fetchMyEvents();
    }
  }, [session, status]);

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;

    setShowDeleteConfirmation(false);
    setDeleting(true);
    setFeedbackMessage(null);

    try {
      const response = await fetch(`/api/events/${eventToDelete.slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal menghapus event.');
      }

      setFeedbackMessage('Event berhasil dihapus!');
      alert('Event berhasil dihapus!');
      setMyEvents(prevEvents => prevEvents.filter(e => e.id !== eventToDelete.id));
      setEventToDelete(null);
    } catch (err: any) {
      console.error('Error deleting event:', err);
      setFeedbackMessage(err.message || 'Terjadi kesalahan saat menghapus event.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setEventToDelete(null);
    setShowDeleteConfirmation(false);
  };

  if (status === 'loading' || (status === 'unauthenticated') || (status === 'authenticated' && (session?.user as any)?.role !== 'ORGANIZER' && (session?.user as any)?.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-lg text-[#2596BE]">
            {loading || status === 'loading' ? 'Memeriksa izin...' : 'Akses Ditolak'}
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Event Saya</h1>

        {feedbackMessage && (
          <div className={`p-3 mb-4 rounded-md text-center ${feedbackMessage.includes('berhasil') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {feedbackMessage}
          </div>
        )}

        {/* Tombol Create New Event */}
        <div className="mb-8 text-right">
          <Link href="/my-events/create">
            <button className="bg-[#2596BE] text-white px-6 py-3 rounded-full flex items-center gap-2 justify-center ml-auto hover:bg-[#1e7a9e] transition-colors">
              <FaPlusCircle /> Buat Event Baru
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center text-gray-600 text-lg py-20 min-h-[300px]">
            <p>Memuat event Anda...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center text-red-600 text-lg py-20 min-h-[300px]">
            <p>{error}</p>
          </div>
        ) : myEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-md shadow hover:shadow-lg transition-shadow duration-300 hover:shadow-[#D0EBF4] h-full flex flex-col">
                {/* Link ke halaman detail event */}
                <Link href={`/event/${event.slug}`} passHref className="block flex-grow">
                  <div className="relative w-full h-48">
                    <Image
                      src={event.imageUrl || '/placeholder.jpg'}
                      alt={event.title}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-t-md"
                    />
                  </div>
                  <div className="p-4 flex flex-col">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-2">{event.title}</h2>
                    <p className="text-sm text-gray-600 line-clamp-3">{event.description}</p>
                  </div>
                </Link>
                {/* Tombol Edit, Delete, dan Lihat Pendaftar */}
                <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
                  <Link href={`/my-events/edit/${event.slug}`} passHref>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm flex items-center gap-1 hover:bg-blue-600 transition-colors">
                      <FaEdit /> Edit
                    </button>
                  </Link>
                  <Link href={`/my-events/registrations/${event.slug}`} passHref>
                    <button className="bg-green-500 text-white px-4 py-2 rounded-full text-sm flex items-center gap-1 hover:bg-green-600 transition-colors">
                      <FaUsers /> Pendaftar
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(event)}
                    className="bg-red-500 text-white px-4 py-2 rounded-full text-sm flex items-center gap-1 hover:bg-red-600 transition-colors"
                  >
                    <FaTrashAlt /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center text-gray-600 text-lg py-20 min-h-[300px]">
            <p>Anda belum membuat event apa pun.</p>
          </div>
        )}
      </main>

      <Footer />

      {/* Popup Konfirmasi Hapus Event */}
      {showDeleteConfirmation && eventToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Konfirmasi Hapus Event</h3>
            <p className="text-gray-700 mb-6">
              Apakah Anda yakin ingin menghapus acara **{eventToDelete.title}**?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={deleting}
                className="px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tidak, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

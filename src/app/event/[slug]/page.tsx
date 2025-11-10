// src/app/event/[slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Image from 'next/image';
import Link from 'next/link';

// Definisikan tipe untuk Event (sama)
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
  organizer?: {
    name: string;
    email: string;
  };
  benefits?: string[];
}

export default function EventDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchEventAndRegistrationStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const eventResponse = await fetch(`/api/events/${slug}`);
        if (!eventResponse.ok) {
          if (eventResponse.status === 404) {
            setError('Event not found.');
          } else {
            throw new Error('Failed to fetch event details.');
          }
        }
        const data: Event = await eventResponse.json();
        setEvent(data);

        if (status === 'authenticated' && session?.user?.id && data.id) {
          const registrationCheckResponse = await fetch(`/api/registrations?eventId=${data.id}&userId=${session.user?.id}`);
          if (registrationCheckResponse.ok) {
            const registrationCheckData = await registrationCheckResponse.json();
            setIsRegistered(registrationCheckData.isRegistered);
          } else {
            console.error('Failed to check registration status.');
          }
        }

      } catch (err: any) {
        console.error('Error fetching event or registration status:', err);
        setError(err.message || 'Could not load event details or registration status.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndRegistrationStatus();
  }, [slug, status, session?.user?.id]);

  const handleRegisterClick = () => {
    setShowConfirmationPopup(true);
  };

  const handleConfirmRegistration = async () => {
    setShowConfirmationPopup(false);
    setRegistrationLoading(true);
    setRegistrationMessage(null);

    if (!event?.id || !session?.user?.id) {
      setRegistrationMessage('Error: Event or user data missing for registration.');
      setRegistrationLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId: event.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register for event.');
      }

      setRegistrationMessage('Successfully registered for the event!');
      setIsRegistered(true);
      alert('Berhasil mendaftar acara!');
    } catch (err: any) {
      console.error('Error during event registration:', err);
      setRegistrationMessage(err.message || 'An error occurred during registration.');
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleCancelRegistration = () => {
    setShowConfirmationPopup(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-lg text-[#2596BE]">Loading event details...</p>
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
          <Link href="/event" className="bg-[#2596BE] text-white px-6 py-3 rounded-full hover:bg-[#1e7a9e] transition-colors">
            Back to Events
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 text-center">
          <p className="text-xl text-gray-700 mb-4">Event data is missing.</p>
          <Link href="/event" className="bg-[#2596BE] text-white px-6 py-3 rounded-full hover:bg-[#1e7a9e] transition-colors">
            Back to Events
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const registerButtonClasses = `
    text-white px-8 py-4 border border-transparent text-lg font-medium rounded-md shadow-sm 
    transition duration-150 ease-in-out w-full
    ${
      registrationLoading || isRegistered || status === 'unauthenticated'
        ? 'bg-gray-400 cursor-not-allowed'
        : 'bg-[#2596BE] hover:bg-[#1e7a9e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2596BE]'
    }
  `;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row gap-8 bg-white rounded-lg shadow-xl overflow-hidden p-8 border border-gray-200">
            {/* Bagian Kiri: Poster Event */}
            <div className="md:w-1/2 flex justify-center items-start">
              {event.imageUrl ? (
                // Mengubah div pembungkus dan Image untuk penyesuaian ukuran asli tanpa box
                // Kontainer ini akan memiliki aspect-ratio yang fleksibel
                <div className="relative w-full h-auto pb-[100%] md:pb-[133.33%] lg:pb-[150%] xl:pb-[160%] rounded-lg overflow-hidden shadow-md"> {/* Padding-bottom trick for aspect ratio */}
                  <Image
                    src={event.imageUrl}
                    alt={event.title}
                    layout="fill" // Mengisi parent div
                    objectFit="contain" // Memastikan gambar fit di dalam div tanpa terpotong, menjaga aspek rasio
                    className="rounded-lg" // Rounded corners pada gambar
                  />
                </div>
              ) : (
                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                  No Image Available
                </div>
              )}
            </div>

            {/* Bagian Kanan: Detail Event */}
            <div className="md:w-1/2 p-4 flex flex-col">
              <h2 className="text-sm font-semibold text-gray-500 mb-1">
                {event.organizer?.name || 'Unknown Organizer'}
              </h2>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-3 leading-tight">
                {event.title}
              </h1>
              <p className="text-xl font-bold text-[#2596BE] mb-6">
                {event.price}
              </p>
              <p className="text-gray-700 text-base leading-relaxed mb-6">
                {event.description}
              </p>

              {/* Detail Info dengan Ikon */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-[#2596BE]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-[#2596BE]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l3 3a1 1 0 001.414-1.414L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-[#2596BE]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1h2a2 2 0 012 2v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2V6a2 2 0 012-2h2V3a1 1 0 011-1zM5 8a1 1 0 00-1 1v4h12V9a1 1 0 00-1-1H5z" clipRule="evenodd" />
                  </svg>
                  <span>{(event.benefits && event.benefits.length > 0) ? event.benefits.join(', ') : 'No specific benefits listed'}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-[#2596BE]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>{event.location}</span>
                </div>
              </div>

              {/* Tombol Join Event */}
              {status === 'authenticated' ? (
                <button
                  onClick={handleRegisterClick}
                  disabled={registrationLoading || isRegistered}
                  className={registerButtonClasses}
                >
                  {registrationLoading ? 'Registering...' : isRegistered ? 'Already Registered' : 'Register Now'}
                </button>
              ) : (
                <div className="bg-gray-200 text-gray-600 px-8 py-4 rounded-md text-lg font-medium text-center cursor-not-allowed w-full">
                  Register/Login First to Join
                  <Link href="/login" className="text-blue-600 hover:underline ml-2">Login here</Link>
                </div>
              )}
              {registrationMessage && (
                <p className={`text-sm mt-2 text-center ${registrationMessage.includes('Successfully') ? 'text-green-600' : 'text-red-600'}`}>
                  {registrationMessage}
                </p>
              )}
              <p className="text-gray-500 text-sm mt-4 text-center">
                You can check your registration status on My List
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Popup Konfirmasi */}
      {showConfirmationPopup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Konfirmasi Pendaftaran</h3>
            <p className="text-gray-700 mb-6">
              Yakin ingin mendaftar acara **{event?.title}**?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleConfirmRegistration}
                className="px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#2596BE] hover:bg-[#1e7a9e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2596BE]"
              >
                Ya, Daftar
              </button>
              <button
                onClick={handleCancelRegistration}
                className="px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
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
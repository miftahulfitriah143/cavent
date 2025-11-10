// src/app/event/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EventCard from '../components/EventCard';
import CategoryFilter from '../components/CategoryFilter';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

// Definisikan tipe untuk Event (sesuai dengan API /api/events)
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
  category?: string;
}

// Konfigurasi Kategori (sesuaikan dengan data Anda)
const categories = [
  'All',
  'Desain Komunikasi Visual',
  'Desain Produk',
  'Falsafah Agama',
  'Hubungan Internasional',
  'Ilmu Komunikasi',
  'Manajemen',
  'Paramadina',
  'Psikologi',
  'Teknik Informatika'
];

export default function EventsPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [errorFetching, setErrorFetching] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');


  useEffect(() => {
    const fetchEventsAndRegistrations = async () => {
      try {
        setLoadingEvents(true);
        setErrorFetching(null);

        const eventsResponse = await fetch('/api/events');
        if (!eventsResponse.ok) {
          throw new Error('Failed to fetch events');
        }
        const eventsData: Event[] = await eventsResponse.json();
        setEvents(eventsData);

        if (status === 'authenticated' && session?.user?.id) {
          const registrationsResponse = await fetch(`/api/registrations/my-registrations`);
          if (registrationsResponse.ok) {
            const registrationsData = await registrationsResponse.json();
            setUserRegistrations(new Set(registrationsData.registeredEventIds));
          } else {
            console.error('Failed to fetch user registrations.');
          }
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setErrorFetching(err.message || 'Could not load data.');
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEventsAndRegistrations();
  }, [status, session?.user?.id]);

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSearchChange = (searchTerm: string) => {
    setSearch(searchTerm);
  };

  const filteredEvents = events
    .filter((event) => {
      if (selectedCategory === 'All') return true;
      return (event.category || '').toLowerCase() === selectedCategory.toLowerCase();
    })
    .filter((event) =>
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      (event.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (event.organizer?.name || '').toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1">
        <div className="py-10 px-4 sm:px-6 lg:px-8 mx-auto w-full max-w-7xl">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">Discover Cavent Events</h1>
          <CategoryFilter
            onSelectCategory={handleSelectCategory}
            onSearchChange={handleSearchChange}
            selectedCategory={selectedCategory}
            searchTerm={search}
          />
        </div>

        <div className="px-4 sm:px-6 lg:px-8 mx-auto w-full max-w-7xl pb-10">
          {loadingEvents ? (
            <div className="flex items-center justify-center text-gray-600 text-lg py-20 min-h-[300px]">
              <p>Loading events...</p>
            </div>
          ) : errorFetching ? (
            <div className="flex items-center justify-center text-red-600 text-lg py-20 min-h-[300px]">
              <p>{errorFetching}</p>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredEvents.map((event) => {
                // isUserAuthenticated dan hasUserRegistered tidak lagi digunakan di sini
                // karena tombol register sudah dihapus dari card
                // const isUserAuthenticated = status === 'authenticated';
                // const hasUserRegistered = userRegistrations.has(event.id);

                return (
                  // Wrapper untuk setiap Event Card dengan styling kartu
                  <Link
                    key={event.id}
                    href={`/event/${event.slug}`} // Link ke halaman detail event
                    passHref
                    className="block"
                  >
                    <div className="bg-white rounded-md shadow hover:shadow-lg transition-shadow duration-300 hover:shadow-[#D0EBF4] cursor-pointer h-full flex flex-col">
                      {/* EventCard murni presentasional, tanpa tombol */}
                      <EventCard
                        image={event.imageUrl || '/placeholder.jpg'}
                        title={event.title}
                        description={event.description}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center text-gray-600 text-lg py-20 min-h-[300px]">
              <p>No events found matching your criteria.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

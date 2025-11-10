// src/app/page.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useSession } from 'next-auth/react';
import EventCard from '../components/EventCard'; // Import EventCard

// Definisikan tipe untuk Event (sesuai dengan API)
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
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED'; // Tambahkan status
}

// Komponen EventGrid yang kini mengambil props events
function EventGrid({ events }: { events: Event[] }) {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-600 text-lg py-10">
        <p>Belum ada event yang tersedia.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {events.map(event => (
        <Link key={event.id} href={`/event/${event.slug}`} passHref>
          <div className="bg-white rounded-md shadow hover:shadow-lg transition-shadow duration-300 hover:shadow-[#D0EBF4] cursor-pointer h-full flex flex-col">
            <EventCard
              image={event.imageUrl || '/placeholder.jpg'}
              title={event.title}
              description={event.description}
              organizerName={event.organizer?.name || 'Unknown'}
            />
          </div>
        </Link>
      ))}
    </div>
  );
}

// Komponen Section (tetap sama)
function Section({ title, children, link }: { title: string, children: React.ReactNode, link?: string }) {
  return (
    <section className="mt-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {link && (
          <Link href={link} className="text-sm px-4 py-1 border rounded hover:bg-gray-100 transition-colors duration-300">
            Lihat Semua
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}


export default function HomePage() {
  const exploreRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();

  // States untuk event sections
  const [newEvents, setNewEvents] = useState<Event[]>([]);
  const [highestRatedEvents, setHighestRatedEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [paramadinaEvents, setParamadinaEvents] = useState<Event[]>([]); // Untuk kategori Paramadina
  const [loadingSections, setLoadingSections] = useState(true);
  const [errorSections, setErrorSections] = useState<string | null>(null);

  useEffect(() => {
    const fetchSectionEvents = async () => {
      try {
        setLoadingSections(true);
        setErrorSections(null);

        // Fetch New Events (misal: 3 event terbaru yang UPCOMING)
        const newEventsRes = await fetch('/api/events?limit=3&orderBy=createdAt_desc');
        const newEventsData: Event[] = await newEventsRes.json();
        setNewEvents(newEventsData);

        // Fetch Highest Rated Events (placeholder, karena belum ada rating)
        // Untuk saat ini, bisa jadi event UPCOMING teratas atau event acak
        const highestRatedRes = await fetch('/api/events?limit=7&orderBy=date_asc'); // Contoh: 7 event terdekat
        const highestRatedData: Event[] = await highestRatedRes.json();
        setHighestRatedEvents(highestRatedData);

        // Fetch Past Events (misal: 3 event yang COMPLETED)
        const pastEventsRes = await fetch('/api/events?limit=3&status=completed&orderBy=date_desc');
        const pastEventsData: Event[] = await pastEventsRes.json();
        setPastEvents(pastEventsData);

        // Fetch Paramadina Events (misal: 3 event dari organizer Paramadina atau kategori Paramadina)
        // Ini membutuhkan kolom `category` atau filter `organizer.name` di API
        // Untuk saat ini, bisa jadi event acak atau event yang dibuat oleh organizer 'Paramadina'
        const paramadinaEventsRes = await fetch('/api/events?limit=3&category=Paramadina'); // Asumsikan ada kategori 'Paramadina'
        const paramadinaEventsData: Event[] = await paramadinaEventsRes.json();
        setParamadinaEvents(paramadinaEventsData);

      } catch (err: any) {
        console.error('Error fetching home sections:', err);
        setErrorSections('Gagal memuat bagian event di beranda.');
      } finally {
        setLoadingSections(false);
      }
    };

    fetchSectionEvents();
  }, []); // Hanya dijalankan sekali saat komponen dimuat


  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />

      <section className="relative w-full h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] flex items-center justify-center px-8 md:px-20 bg-gradient-to-br from-[#ffffff] to-[#ffffff] text-black overflow-hidden mt-0">
        <div className="absolute inset-0 z-0 opacity-40"
             style={{
               background: 'radial-gradient(circle at top right, #D0EBF4, transparent), radial-gradient(circle at bottom left, #D0EBF4, transparent)',
             }}
        ></div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl">
          <p className="text-sm md:text-base text-black-300 mb-6 border border-gray-600 rounded-full px-4 py-2">
            Ingin bergabung dengan event hebat?
          </p>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
            Cavent siap membantu <span className="inline-block animate-bounce-custom">🚀</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl">
            Dengan Cavent, semua event kampus ada di ujung jari Anda! Rasakan kemudahan mencari, menemukan, dan menikmati event kampus yang menarik. Dari seminar akademik yang meningkatkan pengetahuan Anda dan workshop praktis yang mengasah keterampilan Anda, hingga festival seni yang memicu kreativitas dan acara sosial yang memperluas lingkaran pertemanan Anda. Jadilah bagian dari komunitas kampus yang dinamis dan maksimalkan potensi Anda dengan Cavent!
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
            onClick={() => exploreRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="mt-6 px-8 py-3 bg-[#2596be] text-white rounded-lg hover:bg-[#1e7a9e] transition-colors duration-300 text-lg font-semibold"
            >
              Jelajahi Sekarang!
              </button>
          </div>
        </div>
      </section>
       
      <div ref={exploreRef} id="explore-section" className="max-w-7xl mx-auto flex-1 px-8 md:px-0 pt-20">
        {loadingSections ? (
          <div className="flex items-center justify-center text-gray-600 text-lg py-20 min-h-[300px]">
            <p>Memuat event...</p>
          </div>
        ) : errorSections ? (
          <div className="flex items-center justify-center text-red-600 text-lg py-20 min-h-[300px]">
            <p>{errorSections}</p>
          </div>
        ) : (
          <>
            {/* Paramadina Events */}
            <Section title="Event Paramadina!" link="/event?category=Paramadina">
              {paramadinaEvents.length > 0 ? (
                <Link href={`/event/${paramadinaEvents[0].slug}`} passHref> {/* Link ke detail event pertama */}
                  <Image src={paramadinaEvents[0].imageUrl || '/placeholder.jpg'} alt={paramadinaEvents[0].title} width={800} height={300} className="rounded-lg w-full object-cover h-60" />
                </Link>
              ) : (
                <div className="w-full h-60 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                  Belum ada event Paramadina.
                </div>
              )}
            </Section>

            {/* New Events */}
            <Section title="Event Terbaru!" link="/event?orderBy=createdAt_desc">
              <EventGrid events={newEvents} />
            </Section>

            {/* Highest Rated Events (Horizontal Scroll) */}
            <Section title="Event Paling Diminati!">
              {highestRatedEvents.length > 0 ? (
                <div className="overflow-x-auto flex gap-4 py-4">
                  {highestRatedEvents.map(event => (
                    <Link key={event.id} href={`/event/${event.slug}`} passHref>
                      <div className="flex-shrink-0 w-[220px] h-[300px] relative rounded-md overflow-hidden shadow-md">
                        <Image src={event.imageUrl || '/placeholder.jpg'} alt={event.title} layout="fill" objectFit="cover" className="rounded-md" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 text-white text-sm font-semibold">
                          {event.title}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center text-gray-600 text-lg py-10">
                  Belum ada event yang paling diminati.
                </div>
              )}
            </Section>

            {/* Past Events */}
            <Section title="Event Lalu!" link="/event?status=completed">
              <EventGrid events={pastEvents} />
            </Section>
          </>
        )}
      </div> {/* End of Explore Section */}

      <div className="bg-[#D0EBF4] py-10 mt-10 px-12 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Ayo Bergabung!</h2>
        <div className="flex gap-4">
          {status === 'unauthenticated' ? (
            <>
              <Link href="/register" className="px-5 py-2 bg-[#2596be] text-white rounded hover:bg-[#1e7a9e] transition-colors duration-300">Daftar</Link>
              <Link href="/login" className="px-5 py-2 border border-gray-400 rounded hover:bg-[#98D4E8] transition-colors duration-300">Login</Link>
            </>
          ) : (
            <Link href="/event" className="px-5 py-2 bg-[#2596be] text-white rounded hover:bg-[#1e7a9e] transition-colors duration-300">
              Jelajahi Event
            </Link>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
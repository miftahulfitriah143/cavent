// src/app/my-events/edit/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '../../../components/Navbar'; // Sesuaikan path
import Footer from '../../../components/Footer'; // Sesuaikan path
import Image from 'next/image';

export default function EditEventPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { slug } = useParams(); // Ambil slug dari URL

  // States untuk form event
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // Untuk display URL gambar yang sudah ada
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null); // Untuk upload gambar baru
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null); // Untuk preview gambar baru
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [benefits, setBenefits] = useState('');

  const [loadingEvent, setLoadingEvent] = useState(true); // Loading saat fetch data event
  const [submitting, setSubmitting] = useState(false); // Loading saat submit form
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Efek untuk memuat data event yang ada
  useEffect(() => {
    if (!slug || status === 'loading') return;

    // Redirect jika tidak login atau bukan organizer/admin
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    } else if ((session?.user as any)?.role !== 'ORGANIZER' && (session?.user as any)?.role !== 'ADMIN') {
      alert('Anda tidak memiliki izin untuk mengedit event. Mengarahkan ke beranda.');
      router.push('/');
      return;
    }

    const fetchEventData = async () => {
      try {
        setLoadingEvent(true);
        const response = await fetch(`/api/events/${slug}`);
        if (!response.ok) {
          throw new Error('Gagal memuat detail event.');
        }
        const eventData = await response.json();
        
        // Isi form dengan data event yang ada
        setTitle(eventData.title);
        setDescription(eventData.description);
        setImageUrl(eventData.imageUrl); // Set URL gambar yang sudah ada
        setDate(eventData.date); // Format YYYY-MM-DD
        setTime(eventData.time);
        setLocation(eventData.location);
        setPrice(eventData.price);
        setBenefits(eventData.benefits?.join(', ') || ''); // Join array benefits ke string
      } catch (err: any) {
        console.error('Error fetching event for edit:', err);
        setError(err.message || 'Tidak dapat memuat event untuk diedit.');
      } finally {
        setLoadingEvent(false);
      }
    };

    fetchEventData();
  }, [slug, session, status, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setError(null);
      setSuccess(null);
    } else {
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    // Otentikasi dan Otorisasi (cek lagi di frontend untuk UX)
    if (status !== 'authenticated' || ((session?.user as any)?.role !== 'ORGANIZER' && (session?.user as any)?.role !== 'ADMIN')) {
      setError('Autentikasi atau izin tidak cukup.');
      setSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('date', date);
    formData.append('time', time);
    formData.append('location', location);
    formData.append('price', price);
    formData.append('benefits', benefits);
    
    // Hanya tambahkan file poster jika ada file baru yang dipilih
    if (selectedImageFile) {
      formData.append('poster', selectedImageFile);
    } else {
      // Jika tidak ada file baru, kirim URL gambar yang sudah ada
      formData.append('imageUrl', imageUrl); 
    }

    try {
      const response = await fetch(`/api/events/${slug}`, { // Gunakan method PUT untuk update
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal mengedit event.');
      }

      const data = await response.json();
      setSuccess('Event berhasil diperbarui!');
      alert('Event berhasil diperbarui!');
      console.log('Event updated:', data.event);
      router.push('/my-events'); // Redirect kembali ke daftar event saya
    } catch (err: any) {
      console.error('Error updating event:', err);
      setError(err.message || 'Terjadi kesalahan saat memperbarui event.');
    } finally {
      setSubmitting(false);
    }
  };

  // Tampilkan loading/redirect jika status sesi masih loading atau user tidak berhak
  if (loadingEvent || status === 'loading' || (status === 'authenticated' && (session?.user as any)?.role !== 'ORGANIZER' && (session?.user as any)?.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-lg text-[#2596BE]">
            {loadingEvent || status === 'loading' ? 'Memuat event...' : 'Akses Ditolak'}
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
          <button onClick={() => router.back()} className="bg-[#2596BE] text-white px-6 py-3 rounded-full hover:bg-[#1e7a9e] transition-colors">
            Kembali
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-10 max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
          <h1 className="text-3xl font-bold text-[#2596BE] mb-6 text-center">Edit Event: {title}</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Judul Event</label>
              <input
                type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-[#2596BE]"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Deskripsi</label>
              <textarea
                id="description" value={description} onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-[#2596BE]"
                required
              ></textarea>
            </div>
            
            {/* Bagian Upload Gambar Poster */}
            <div>
              <label htmlFor="poster" className="block text-gray-700 text-sm font-bold mb-2">Poster Event (Pilih baru untuk mengganti)</label>
              <input
                type="file" id="poster" accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="mb-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#2596BE] hover:file:bg-blue-100"
              />
              {selectedImageFile && (
                <p className="text-sm text-gray-600 mb-2">File dipilih: {selectedImageFile.name}</p>
              )}
              {imagePreviewUrl ? (
                <div className="mt-2 w-full h-48 relative border rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                  <Image src={imagePreviewUrl} alt="Pratinjau Gambar Baru" layout="fill" objectFit="contain" className="rounded-md" />
                </div>
              ) : imageUrl && ( // Tampilkan gambar yang sudah ada jika tidak ada preview baru
                <div className="mt-2 w-full h-48 relative border rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                  <Image src={imageUrl} alt="Poster Event Saat Ini" layout="fill" objectFit="contain" className="rounded-md" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-gray-700 text-sm font-bold mb-2">Tanggal</label>
                <input
                  type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-[#2596BE]"
                  required
                />
              </div>
              <div>
                <label htmlFor="time" className="block text-gray-700 text-sm font-bold mb-2">Waktu</label>
                <input
                  type="text" id="time" value={time} onChange={(e) => setTime(e.target.value)}
                  placeholder="misalnya, 09:00 - 12:00"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-[#2596BE]"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="location" className="block text-gray-700 text-sm font-bold mb-2">Lokasi</label>
              <input
                type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-[#2596BE]"
                required
              />
            </div>
            <div>
              <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">Harga</label>
              <input
                type="text" id="price" value={price} onChange={(e) => setPrice(e.target.value)}
                placeholder="misalnya, GRATIS, Rp 50.000"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-[#2596BE]"
                required
              />
            </div>
            <div>
              <label htmlFor="benefits" className="block text-gray-700 text-sm font-bold mb-2">Manfaat (Pisahkan dengan koma atau baris baru)</label>
              <textarea
                id="benefits" value={benefits} onChange={(e) => setBenefits(e.target.value)}
                rows={3}
                placeholder="misalnya, Snack, E-Certificate, Doorprize"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-[#2596BE]"
              ></textarea>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {success && <p className="text-green-500 text-sm text-center">{success}</p>}

            <button
              type="submit" disabled={submitting}
              className="mt-6 bg-[#2596BE] text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-[#1e7a9e] transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Memperbarui Event...' : 'Perbarui Event'}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

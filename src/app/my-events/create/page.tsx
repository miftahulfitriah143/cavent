    // src/app/my-events/create/page.tsx
    'use client';

    import { useState, useEffect } from 'react';
    import { useRouter } from 'next/navigation';
    import { useSession } from 'next-auth/react';
    import Navbar from '../../components/Navbar'; 
    import Footer from '../../components/Footer';
    import Image from 'next/image';

    export default function CreateEventPage() {
      const { data: session, status } = useSession();
      const router = useRouter();

      const [title, setTitle] = useState('');
      const [description, setDescription] = useState('');
      const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
      const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
      const [date, setDate] = useState('');
      const [time, setTime] = useState('');
      const [location, setLocation] = useState('');
      const [price, setPrice] = useState('');
      const [benefits, setBenefits] = useState('');
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);
      const [success, setSuccess] = useState<string | null>(null);

      useEffect(() => {
        if (status === 'loading') return;
        
        if (status === 'unauthenticated') {
          router.push('/login');
        } else if ((session?.user as any)?.role !== 'ORGANIZER' && (session?.user as any)?.role !== 'ADMIN') {
          alert('Anda tidak memiliki izin untuk membuat event. Mengarahkan ke beranda.');
          router.push('/');
        }
      }, [session, status, router]);

      const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const MAX_PREVIEW_SIZE = 5 * 1024 * 1024; // 5MB
          const ALLOWED_PREVIEW_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

          if (file.size > MAX_PREVIEW_SIZE) {
            setError('Ukuran file melebihi batas 5MB untuk pratinjau.');
            setSelectedImageFile(null);
            setImagePreviewUrl(null);
            return;
          }
          if (!ALLOWED_PREVIEW_TYPES.includes(file.type)) {
            setError('Hanya gambar JPEG, PNG, GIF, WebP yang diizinkan.');
            setSelectedImageFile(null);
            setImagePreviewUrl(null);
            return;
          }

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
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!selectedImageFile) {
            setError('Mohon pilih gambar poster event.');
            setLoading(false);
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
        formData.append('poster', selectedImageFile);

        try {
          const response = await fetch('/api/events', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Gagal membuat event.');
          }

          const data = await response.json();
          setSuccess('Event berhasil dibuat!');
          alert('Event berhasil dibuat!');
          
          // Reset form
          setTitle('');
          setDescription('');
          setSelectedImageFile(null);
          setImagePreviewUrl(null);
          setDate('');
          setTime('');
          setLocation('');
          setPrice('');
          setBenefits('');
          
          console.log('New event:', data.event);
          router.push('/event'); // Redirect ke daftar event setelah berhasil
        } catch (err: any) {
          console.error('Create event error:', err);
          setError(err.message || 'Terjadi kesalahan saat membuat event.');
        } finally {
          setLoading(false);
        }
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

          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-10 max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
              <h1 className="text-3xl font-bold text-[#2596BE] mb-6 text-center">Buat Event Baru</h1>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Judul Event</label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-[#2596BE]"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Deskripsi</label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-[#2596BE]"
                    required
                  ></textarea>
                </div>
                
                <div>
                  <label htmlFor="poster" className="block text-gray-700 text-sm font-bold mb-2">Gambar Poster Event</label>
                  <input
                    type="file"
                    id="poster"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileChange}
                    className="mb-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#2596BE] hover:file:bg-blue-100"
                    required
                  />
                  {selectedImageFile && (
                    <p className="text-sm text-gray-600 mb-2">File dipilih: {selectedImageFile.name}</p>
                  )}
                  {imagePreviewUrl && (
                    <div className="mt-2 w-full h-48 relative border rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                      <Image 
                        src={imagePreviewUrl} 
                        alt="Pratinjau Gambar" 
                        layout="fill" 
                        objectFit="contain"
                        className="rounded-md"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="date" className="block text-gray-700 text-sm font-bold mb-2">Tanggal</label>
                    <input
                      type="date"
                      id="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-[#2596BE]"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="time" className="block text-gray-700 text-sm font-bold mb-2">Waktu</label>
                    <input
                      type="text"
                      id="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      placeholder="misalnya, 09:00 - 12:00"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-[#2596BE]"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="location" className="block text-gray-700 text-sm font-bold mb-2">Lokasi</label>
                  <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-[#2596BE]"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">Harga</label>
                  <input
                    type="text"
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="misalnya, GRATIS, Rp 50.000"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-[#2596BE]"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="benefits" className="block text-gray-700 text-sm font-bold mb-2">Manfaat (Pisahkan dengan koma atau baris baru)</label>
                  <textarea
                    id="benefits"
                    value={benefits}
                    onChange={(e) => setBenefits(e.target.value)}
                    rows={3}
                    placeholder="misalnya, Snack, E-Certificate, Doorprize"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-[#2596BE]"
                  ></textarea>
                </div>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                {success && <p className="text-green-500 text-sm text-center">{success}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 bg-[#2596BE] text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-[#1e7a9e] transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Membuat Event...' : 'Buat Event'}
                </button>
              </form>
            </div>
          </main>

          <Footer />
        </div>
      );
    }
    
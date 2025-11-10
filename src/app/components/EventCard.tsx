// components/EventCard.tsx
'use client';
import Image from 'next/image';

type Props = {
  image: string; // URL gambar poster
  title: string;
  description: string;
};

export default function EventCard({ image, title, description }: Props) {
  return (
    // Kontainer utama kartu. h-full flex flex-col penting untuk menjaga layout di dalam wrapper Link.
    <div className="h-full flex flex-col">
      {/* Gambar Poster Event */}
      <div className="relative w-full h-48"> {/* Atur tinggi kontainer gambar agar konsisten */}
        <Image
          src={image || '/placeholder.jpg'} // Fallback ke gambar placeholder jika image kosong
          alt={title}
          layout="fill" // Gunakan layout="fill" untuk gambar responsif
          objectFit="cover" // Memastikan gambar menutupi area yang ditentukan tanpa distorsi
          className="rounded-t-md" // Rounded corners hanya di bagian atas gambar
        />
      </div>

      {/* Konten Detail Teks Event */}
      <div className="p-4 flex flex-col flex-grow"> {/* flex-grow agar konten mengisi sisa ruang dan mendorong apapun ke bawah */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-2">{title}</h2> {/* Nama Acara, batasi 2 baris */}
        <p className="text-sm text-gray-600 line-clamp-3 flex-grow">{description}</p> {/* Deskripsi, batasi 3 baris */}
      </div>
    </div>
  );
}
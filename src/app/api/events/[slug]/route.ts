// src/app/api/events/[slug]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Role } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

// Konfigurasi Cloudinary (pastikan kredensial ada di .env.local)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to generate slug from title
const generateSlug = (title: string): string => {
  return title.toLowerCase()
              .replace(/[^a-z0-9 -]/g, '')
              .replace(/\s+/g, '-')
              .replace(/^-+|-+$/g, '');
};

// --- GET method (sudah ada) ---
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  if (!slug) {
    return NextResponse.json({ message: 'Slug diperlukan' }, { status: 400 });
  }

  try {
    const event = await prisma.event.findUnique({
      where: {
        slug: slug,
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ message: 'Event tidak ditemukan' }, { status: 404 });
    }

    const formattedEvent = {
      id: event.id,
      title: event.title,
      description: event.description || '',
      imageUrl: event.imageUrl || '/placeholder.jpg',
      date: event.date.toISOString().split('T')[0],
      time: event.time,
      location: event.location,
      price: event.price,
      slug: event.slug,
      benefits: event.benefits || [],
      organizer: event.organizer ? { id: event.organizer.id, name: event.organizer.name, email: event.organizer.email } : undefined,
    };

    return NextResponse.json(formattedEvent, { status: 200 });
  } catch (error) {
    console.error(`Error mengambil event dengan slug ${slug}:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// --- PUT method (untuk memperbarui event) ---
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  // 1. Verifikasi Sesi Pengguna
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || !(session.user as any).role) {
    return NextResponse.json({ message: 'Autentikasi diperlukan' }, { status: 401 });
  }

  const userId = session.user.id;
  const userRole = (session.user as any).role;
  
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  if (!slug) {
    return NextResponse.json({ message: 'Slug diperlukan' }, { status: 400 });
  }

  try {
    // 2. Cari Event yang akan diupdate dan otorisasi
    const existingEvent = await prisma.event.findUnique({
      where: { slug: slug },
    });

    if (!existingEvent) {
      return NextResponse.json({ message: 'Event tidak ditemukan.' }, { status: 404 });
    }

    // Otorisasi: Hanya organizer asli atau ADMIN yang boleh mengedit
    if (userRole === Role.ORGANIZER && existingEvent.organizerId !== userId) {
      return NextResponse.json({ message: 'Terlarang: Anda tidak berwenang mengedit event ini.' }, { status: 403 });
    }
    if (userRole !== Role.ADMIN && userRole !== Role.ORGANIZER) { // Role lain tidak diizinkan
      return NextResponse.json({ message: 'Terlarang: Anda tidak memiliki izin untuk mengedit event.' }, { status: 403 });
    }

    // 3. Dapatkan Data dari Request (FormData)
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const dateString = formData.get('date') as string;
    const time = formData.get('time') as string;
    const location = formData.get('location') as string;
    const price = formData.get('price') as string;
    const benefitsString = formData.get('benefits') as string || '';
    const posterFile = formData.get('poster') as File | null; // Bisa null jika tidak ada file baru
    const existingImageUrl = formData.get('imageUrl') as string | null; // Jika tidak ada file baru, ambil URL lama

    // Validasi dasar
    if (!title || !description || !dateString || !time || !location || !price) {
      return NextResponse.json({ message: 'Semua kolom event diperlukan.' }, { status: 400 });
    }
    const eventDate = new Date(dateString);
    if (isNaN(eventDate.getTime())) {
      return NextResponse.json({ message: 'Format tanggal tidak valid.' }, { status: 400 });
    }

    let updatedImageUrl: string | null = existingImageUrl; // Default ke gambar yang sudah ada

    // Jika ada file poster baru diupload
    if (posterFile && posterFile.size > 0) {
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      if (posterFile.size > MAX_FILE_SIZE) {
        return NextResponse.json({ message: 'Ukuran file poster melebihi batas 5MB.' }, { status: 400 });
      }
      if (!ALLOWED_FILE_TYPES.includes(posterFile.type)) {
        return NextResponse.json({ message: 'Hanya gambar JPEG, PNG, GIF, WebP yang diizinkan untuk poster.' }, { status: 400 });
      }

      const bytes = await posterFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64File = `data:${posterFile.type};base64,${buffer.toString('base64')}`;

      // Upload gambar baru ke Cloudinary
      const uploadResult = await cloudinary.uploader.upload(base64File, {
        folder: 'cavent_event_posters',
        public_id: `event-${generateSlug(title)}-${Date.now()}`,
        quality: 'auto',
        fetch_format: 'auto',
      });
      updatedImageUrl = uploadResult.secure_url;
    }

    // Konversi benefits string menjadi array of strings
    const benefitsArray = benefitsString
      .split(/,|\n/)
      .map(benefit => benefit.trim())
      .filter(benefit => benefit.length > 0);

    // Hasilkan slug baru jika judul berubah
    const newSlug = generateSlug(title);
    let finalSlug = slug; // Default ke slug lama

    if (newSlug !== slug) { // Jika judul berubah, periksa slug baru
        let counter = 0;
        let uniqueNewSlug = newSlug;
        while (await prisma.event.findUnique({ where: { slug: uniqueNewSlug } })) {
            counter++;
            uniqueNewSlug = `${newSlug}-${counter}`;
        }
        finalSlug = uniqueNewSlug;
    }

    // 4. Perbarui Event di Database
    const updatedEvent = await prisma.event.update({
      where: { slug: slug }, // Update berdasarkan slug lama
      data: {
        title,
        description,
        imageUrl: updatedImageUrl, // Gunakan URL gambar yang diperbarui
        date: eventDate,
        time,
        location,
        price,
        slug: finalSlug, // Perbarui slug jika judul berubah
        benefits: benefitsArray,
        // organizerId tidak diubah karena organizer tetap sama
      },
    });

    return NextResponse.json({ message: 'Event berhasil diperbarui', event: updatedEvent }, { status: 200 });
  } catch (error) {
    console.error('Error memperbarui event:', error);
    return NextResponse.json({ message: 'Internal server error atau gagal mengedit event.' }, { status: 500 });
  }
}

// --- DELETE method (sudah ada) ---
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || !(session.user as any).role) {
    return NextResponse.json({ message: 'Autentikasi diperlukan' }, { status: 401 });
  }

  const userId = session.user.id;
  const userRole = (session.user as any).role;
  
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  if (!slug) {
    return NextResponse.json({ message: 'Slug diperlukan' }, { status: 400 });
  }

  try {
    const eventToDelete = await prisma.event.findUnique({
      where: { slug: slug },
      select: { organizerId: true },
    });

    if (!eventToDelete) {
      return NextResponse.json({ message: 'Event tidak ditemukan.' }, { status: 404 });
    }

    if (userRole === Role.ORGANIZER && eventToDelete.organizerId !== userId) {
      return NextResponse.json({ message: 'Terlarang: Anda tidak berwenang menghapus event ini.' }, { status: 403 });
    }
    if (userRole !== Role.ADMIN && userRole !== Role.ORGANIZER) {
      return NextResponse.json({ message: 'Terlarang: Anda tidak memiliki izin untuk menghapus event.' }, { status: 403 });
    }

    await prisma.event.delete({
      where: { slug: slug },
    });

    return NextResponse.json({ message: 'Event berhasil dihapus.' }, { status: 200 });
  } catch (error) {
    console.error('Error menghapus event:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}

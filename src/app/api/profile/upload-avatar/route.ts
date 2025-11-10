// src/app/api/profile/upload-avatar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'; // Untuk mendapatkan sesi user dari server
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Import authOptions Anda
import { prisma } from '@/lib/prisma'; // Sesuaikan path jika berbeda
import { v2 as cloudinary } from 'cloudinary'; // Import Cloudinary SDK

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  // 1. Verifikasi Sesi Pengguna
  // Menggunakan getServerSession untuk mendapatkan sesi di Server Component/API Route
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // 2. Dapatkan File dari Request (FormData)
  const formData = await request.formData();
  const file = formData.get('avatar') as File | null; // 'avatar' adalah nama field di FormData dari frontend

  if (!file) {
    return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
  }

  // Validasi ukuran dan jenis file (opsional tapi direkomendasikan)
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ message: 'File size exceeds 5MB limit' }, { status: 400 });
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return NextResponse.json({ message: 'Only JPEG, PNG, GIF, WebP images are allowed' }, { status: 400 });
  }

  try {
    // 3. Konversi File ke Base64 untuk Upload ke Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = `data:${file.type};base64,${buffer.toString('base64')}`;

    // 4. Upload ke Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64File, {
      folder: 'cavent_avatars', // Folder di Cloudinary Anda
      public_id: `user-${session.user.id}-${Date.now()}`, // Nama file unik
      transformation: [
        { width: 200, height: 200, crop: 'fill', gravity: 'face' }, // Contoh: potong jadi kotak 200x200px fokus ke wajah
        { quality: 'auto', fetch_format: 'auto' } // Optimasi otomatis
      ]
    });

    const imageUrl = uploadResult.secure_url; // URL gambar yang sudah diupload dan dioptimasi

    // 5. Perbarui URL Gambar di Database Pengguna
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl }, // Perbarui kolom 'image' di model User
    });

    // 6. Beri Respons Sukses
    return NextResponse.json({
      message: 'Profile picture updated successfully',
      imageUrl: imageUrl,
    }, { status: 200 });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return NextResponse.json({ message: 'Failed to upload profile picture' }, { status: 500 });
  }
}
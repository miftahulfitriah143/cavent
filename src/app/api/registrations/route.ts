// src/app/api/registrations/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
// PASTIKAN PATH INI BENAR: Mengimpor authOptions dari API NextAuth.js Anda
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
// PASTIKAN PATH INI BENAR: Mengimpor instance prisma dari lib Anda
import { prisma } from '@/lib/prisma';

// --- GET method (untuk mengecek status pendaftaran) ---
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    // Jika tidak ada sesi, diasumsikan user tidak terdaftar (atau tidak bisa dicek)
    // Mengembalikan status 200 karena ini adalah check, bukan error otentikasi
    return NextResponse.json({ isRegistered: false, message: 'Not authenticated to check status.' }, { status: 200 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json({ message: 'Event ID is required for status check.' }, { status: 400 });
  }

  try {
    const existingRegistration = await prisma.registration.findUnique({
      where: {
        userId_eventId: { // Menggunakan @@unique([userId, eventId]) dari Prisma schema
          userId: userId,
          eventId: eventId,
        },
      },
    });

    if (existingRegistration) {
      return NextResponse.json({ isRegistered: true }, { status: 200 });
    } else {
      return NextResponse.json({ isRegistered: false }, { status: 200 });
    }
  } catch (error) {
    console.error('Error checking registration status:', error);
    return NextResponse.json({ message: 'Internal server error checking registration status.' }, { status: 500 });
  }
}

// --- POST method (untuk mendaftar event) ---
export async function POST(request: NextRequest) {
  // 1. Verifikasi Sesi Pengguna (Authentication)
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  const userId = session.user.id; // Dapatkan ID pengguna dari sesi

  // 2. Dapatkan Event ID dari Request Body
  const { eventId } = await request.json();

  if (!eventId) {
    return NextResponse.json({ message: 'Event ID is required' }, { status: 400 });
  }

  try {
    // 3. Pastikan Event Ada
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    // 4. Cek Apakah Pengguna Sudah Terdaftar di Event Ini
    const existingRegistration = await prisma.registration.findUnique({
      where: {
        userId_eventId: { // Menggunakan @@unique([userId, eventId]) dari Prisma schema
          userId: userId,
          eventId: eventId,
        },
      },
    });

    if (existingRegistration) {
      return NextResponse.json({ message: 'You are already registered for this event.' }, { status: 409 }); // 409 Conflict
    }

    // 5. Buat Pendaftaran Baru
    const newRegistration = await prisma.registration.create({
      data: {
        userId: userId,
        eventId: eventId,
      },
    });

    return NextResponse.json({
      message: 'Successfully registered for the event!',
      registration: newRegistration,
    }, { status: 201 }); // 201 Created
  } catch (error) {
    console.error('Error during event registration:', error);
    // Tambahkan penanganan error spesifik Prisma jika diperlukan
    return NextResponse.json({ message: 'Internal server error during registration.' }, { status: 500 });
  }
}
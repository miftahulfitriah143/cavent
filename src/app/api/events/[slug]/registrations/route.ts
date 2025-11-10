// src/app/api/events/[slug]/registrations/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);

  // 1. Autentikasi Pengguna
  if (!session || !session.user || !session.user.id || !(session.user as any).role) {
    return NextResponse.json({ message: 'Autentikasi diperlukan.' }, { status: 401 });
  }

  const userId = session.user.id;
  const userRole = (session.user as any).role;
  
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  if (!slug) {
    return NextResponse.json({ message: 'Slug event diperlukan.' }, { status: 400 });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { slug: slug },
      select: { 
        id: true, 
        title: true, 
        organizerId: true, // Ambil organizerId untuk otorisasi
        registrations: { // Ambil semua pendaftaran terkait event ini
          include: {
            user: { // Sertakan detail user yang mendaftar
              select: {
                id: true,
                name: true,
                email: true,
                // Anda bisa menambahkan field lain yang ingin ditampilkan dari User
              },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ message: 'Event tidak ditemukan.' }, { status: 404 });
    }

    if (userRole === Role.ORGANIZER && event.organizerId !== userId) {
      return NextResponse.json({ message: 'Terlarang: Anda tidak berwenang melihat pendaftar event ini.' }, { status: 403 });
    }
    if (userRole !== Role.ADMIN && userRole !== Role.ORGANIZER) { // Role lain tidak diizinkan
      return NextResponse.json({ message: 'Terlarang: Anda tidak memiliki izin untuk melihat daftar pendaftar.' }, { status: 403 });
    }

    const registeredParticipants = event.registrations.map(reg => ({
      registrationId: reg.id,
      registeredAt: reg.registeredAt,
      user: {
        id: reg.user.id,
        name: reg.user.name,
        email: reg.user.email,
      },
    }));

    return NextResponse.json({
      eventTitle: event.title,
      participants: registeredParticipants,
    }, { status: 200 });

  } catch (error) {
    console.error(`Error fetching registrations for event slug ${slug}:`, error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}

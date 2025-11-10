// src/app/api/events/my-events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || !(session.user as any).role) {
    return NextResponse.json({ message: 'Autentikasi diperlukan' }, { status: 401 });
  }

  const userId = session.user.id;
  const userRole = (session.user as any).role;

  try {
    let events: any[] = [];

    // Jika ADMIN, ambil semua event
    if (userRole === Role.ADMIN) {
      events = await prisma.event.findMany({
        include: {
          organizer: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }
    // Jika ORGANIZER, ambil hanya event yang dibuat oleh user ini
    else if (userRole === Role.ORGANIZER) {
      events = await prisma.event.findMany({
        where: { organizerId: userId },
        include: {
          organizer: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Role lain tidak memiliki akses ke halaman ini
      return NextResponse.json({ message: 'Terlarang: Anda tidak memiliki izin untuk melihat halaman ini.' }, { status: 403 });
    }

    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description || '',
      imageUrl: event.imageUrl || '/placeholder.jpg',
      date: event.date.toISOString().split('T')[0],
      time: event.time,
      location: event.location,
      price: event.price,
      slug: event.slug,
      organizerId: event.organizerId, // Sertakan organizerId untuk otorisasi di frontend (misalnya, tombol edit/delete)
      organizer: event.organizer ? { name: event.organizer.name } : { name: 'Tidak diketahui' },
    }));

    return NextResponse.json(formattedEvents, { status: 200 });
  } catch (error) {
    console.error('Error fetching my events:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}

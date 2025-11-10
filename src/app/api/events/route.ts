// src/app/api/events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Role, EventStatus } from '@prisma/client'; // Pastikan EventStatus diimpor
import { v2 as cloudinary } from 'cloudinary';

// Konfigurasi Cloudinary
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

// --- GET method (untuk mendapatkan semua event, dengan filter baru) ---
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const statusFilter = searchParams.get('status');
  const limit = searchParams.get('limit');
  const orderBy = searchParams.get('orderBy');

  let whereClause: any = {};
  let orderByClause: any = { createdAt: 'desc' };

  if (category && category !== 'All') {
    whereClause.category = category;
  }

  if (statusFilter) {
    // Pastikan statusFilter sesuai dengan enum EventStatus
    if (Object.values(EventStatus).includes(statusFilter.toUpperCase() as EventStatus)) {
      whereClause.status = statusFilter.toUpperCase();
    } else {
      // Jika statusFilter tidak valid, bisa diabaikan atau kembalikan error
      console.warn(`Invalid status filter: ${statusFilter}. Ignoring filter.`);
    }
  } else {
    // Default: hanya tampilkan event yang UPCOMING jika tidak ada filter status
    whereClause.status = EventStatus.UPCOMING; // <-- Baris ini yang error
  }

  if (orderBy === 'date_asc') {
    orderByClause = { date: 'asc' };
  } else if (orderBy === 'createdAt_desc') {
    orderByClause = { createdAt: 'desc' };
  }

  try {
    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: orderByClause,
      take: limit ? parseInt(limit) : undefined,
    });

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
      organizer: event.organizer ? { name: event.organizer.name } : { name: 'Unknown' },
      category: event.category || null,
      benefits: event.benefits || [],
      status: event.status,
    }));

    return NextResponse.json(formattedEvents, { status: 200 });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// --- POST method (untuk membuat event baru, sudah ada) ---
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || !(session.user as any).role) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  const userId = session.user.id;

  if (userRole !== Role.ORGANIZER && userRole !== Role.ADMIN) {
    return NextResponse.json({ message: 'Forbidden: You do not have permission to create events.' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const dateString = formData.get('date') as string;
    const time = formData.get('time') as string;
    const location = formData.get('location') as string;
    const price = formData.get('price') as string;
    const benefitsString = formData.get('benefits') as string || '';
    const posterFile = formData.get('poster') as File;

    if (!title || !description || !dateString || !time || !location || !price || !posterFile) {
      return NextResponse.json({ message: 'All event fields and a poster image are required.' }, { status: 400 });
    }

    const eventDate = new Date(dateString);
    if (isNaN(eventDate.getTime())) {
      return NextResponse.json({ message: 'Invalid date format.' }, { status: 400 });
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (posterFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: 'Poster file size exceeds 5MB limit.' }, { status: 400 });
    }
    if (!ALLOWED_FILE_TYPES.includes(posterFile.type)) {
      return NextResponse.json({ message: 'Only JPEG, PNG, GIF, WebP images are allowed for poster.' }, { status: 400 });
    }

    const benefitsArray = benefitsString
      .split(/,|\n/)
      .map(benefit => benefit.trim())
      .filter(benefit => benefit.length > 0);

    const bytes = await posterFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = `data:${posterFile.type};base64,${buffer.toString('base64')}`;

    const uploadResult = await cloudinary.uploader.upload(base64File, {
      folder: 'cavent_event_posters',
      public_id: `event-${generateSlug(title)}-${Date.now()}`,
      quality: 'auto',
      fetch_format: 'auto',
    });
    const imageUrl = uploadResult.secure_url;

    let eventSlug = generateSlug(title);
    let counter = 0;
    let uniqueSlug = eventSlug;
    while (await prisma.event.findUnique({ where: { slug: uniqueSlug } })) {
      counter++;
      uniqueSlug = `${eventSlug}-${counter}`;
    }
    eventSlug = uniqueSlug;

    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        imageUrl: imageUrl,
        date: eventDate,
        time,
        location,
        price,
        slug: eventSlug,
        benefits: benefitsArray,
        organizer: {
          connect: { id: userId },
        },
        status: EventStatus.UPCOMING, // Default status saat membuat event baru
      },
    });

    return NextResponse.json({ message: 'Event created successfully', event: newEvent }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ message: 'Internal server error or image upload failed.' }, { status: 500 });
  }
}
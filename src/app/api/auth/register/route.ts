// src/app/api/auth/register/route.ts

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma'; // Sesuaikan path jika berbeda
import { Role } from '@prisma/client';
// import crypto from 'crypto'; // Hapus import ini jika tidak digunakan lagi
// import { Resend } from 'resend'; // Hapus import ini jika tidak digunakan lagi

// const resend = new Resend(process.env.RESEND_API_KEY); // Hapus baris ini

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // 1. Validasi Input
    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Name, email, and password are required' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // 2. Cek apakah email sudah terdaftar di database
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
    }

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Tentukan Role Pengguna Berdasarkan Konfigurasi Baru (Tetap seperti sebelumnya)
    let userRole: Role = Role.USER;
    const lowerCaseEmail = email.toLowerCase();

    const ORGANIZER_EMAIL_DOMAINS = ['organizer.paramadina.ac.id', 'org.paramadina.ac.id']; // Sesuaikan
    const ORGANIZER_SPECIFIC_EMAILS = ['bphhimamen@paramadina.ac.id', 'bemfakultas@paramadina.ac.id']; // Sesuaikan

    if (ORGANIZER_SPECIFIC_EMAILS.includes(lowerCaseEmail) ||
        ORGANIZER_EMAIL_DOMAINS.some(domain => lowerCaseEmail.endsWith(domain))) {
      userRole = Role.ORGANIZER;
    }

    // 5. Simpan Pengguna Baru ke Database
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
        // isVerified: false, // Hapus baris ini
        // verificationToken: verificationToken, // Hapus baris ini
      },
      select: {
        id: true, name: true, email: true, role: true, // Hapus isVerified jika ada
        createdAt: true,
      }
    });

    return NextResponse.json({
      message: 'User registered successfully. You can now log in.', // Ubah pesan sukses
      user: newUser,
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Internal server error or registration failed' }, { status: 500 }); // Ubah pesan error
  }
}
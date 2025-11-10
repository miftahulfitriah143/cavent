import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Perluas adapter untuk menambahkan role default saat membuat user baru via OAuth
const CustomPrismaAdapter = {
  ...PrismaAdapter(prisma),
  async createUser(data: any) {
    let userRole: Role = Role.USER;
    const lowerCaseEmail = data.email?.toLowerCase();

    const ORGANIZER_EMAIL_DOMAINS = ['organizer.paramadina.ac.id', 'org.paramadina.ac.id'];
    const ORGANIZER_SPECIFIC_EMAILS = ['bphhimamen@paramadina.ac.id', 'bemfakultas@paramadina.ac.id'];

    if (lowerCaseEmail && (ORGANIZER_SPECIFIC_EMAILS.includes(lowerCaseEmail) ||
        ORGANIZER_EMAIL_DOMAINS.some(domain => lowerCaseEmail.endsWith(domain)))) {
      userRole = Role.ORGANIZER;
    }

    const newUser = await prisma.user.create({
      data: {
        ...data,
        password: null, // Penting agar sesuai dengan 'password String?' di schema.prisma
        role: userRole,
        isVerified: true, // Untuk OAuth, asumsikan email sudah diverifikasi oleh penyedia OAuth (Google)
      },
    });
    return newUser;
  },
};

// Definisikan opsi otentikasi
// Ini adalah objek konfigurasi utama untuk NextAuth.js
export const authOptions = {
  adapter: CustomPrismaAdapter, // Gunakan adapter yang sudah dikustomisasi

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || user.password === null) { // User tidak ditemukan atau tidak punya password (OAuth user)
          return null;
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!passwordMatch) {
          return null; // Password tidak cocok
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
};

// NextAuth.js handler yang menggunakan authOptions yang sudah didefinisikan
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Definisikan tipe tema
type Theme = 'light' | 'dark' | 'system';

// Definisikan tipe konteks
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark'; // Tema yang benar-benar diterapkan
}

// Buat konteks
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Hook kustom untuk menggunakan tema
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Komponen ThemeProvider
interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  // State untuk tema yang dipilih pengguna ('light', 'dark', 'system')
  const [theme, setThemeState] = useState<Theme>('system');
  // State untuk tema yang benar-benar diterapkan ('light' atau 'dark')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Efek untuk membaca preferensi dari localStorage saat pertama kali dimuat
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, []);

  // Efek untuk menerapkan tema ke elemen <html> dan memperbarui resolvedTheme
  useEffect(() => {
    const root = window.document.documentElement;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    let currentResolvedTheme: 'light' | 'dark';

    if (theme === 'system') {
      currentResolvedTheme = systemPrefersDark ? 'dark' : 'light';
    } else {
      currentResolvedTheme = theme;
    }

    setResolvedTheme(currentResolvedTheme);

    // Hapus kelas 'light' dan 'dark' yang mungkin ada
    root.classList.remove('light', 'dark');
    // Tambahkan kelas tema yang diterapkan
    root.classList.add(currentResolvedTheme);

    // Listener untuk perubahan preferensi sistem
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        setResolvedTheme(e.matches ? 'dark' : 'light');
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]); // Jalankan efek ini saat 'theme' berubah

  // Fungsi untuk mengatur tema dan menyimpannya di localStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const contextValue = {
    theme,
    setTheme,
    resolvedTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

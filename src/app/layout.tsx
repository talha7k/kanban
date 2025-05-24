import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google'; // Using Inter as a fallback, Geist is tricky with Next.js sometimes
import localFont from 'next/font/local';
import './globals.css';
import { cn } from '@/lib/utils';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

// Assuming Geist fonts are downloaded and placed in PROJECT_ROOT/public/fonts/ directory
// For example, PROJECT_ROOT/public/fonts/Geist-Regular.otf
const geistSans = localFont({
  src: [
    {
      path: '../../public/fonts/Geist-Regular.otf', // Assumes font is in PROJECT_ROOT/public/fonts/
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Geist-Bold.otf', // Assumes font is in PROJECT_ROOT/public/fonts/
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-geist-sans',
  display: 'swap',
  fallback: ['sans-serif'], // Fallback font
});

const geistMono = localFont({
  src: '../../public/fonts/GeistMono-Regular.otf', // Assumes font is in PROJECT_ROOT/public/fonts/
  variable: '--font-geist-mono',
  display: 'swap',
  fallback: ['monospace'], // Fallback font
});


export const metadata: Metadata = {
  title: 'KanbanAI - Team Management',
  description: 'Kanban-style application using Next.js and Firebase for web development teams.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={cn(
          "min-h-screen bg-background font-sans antialiased", // Use a default font-sans first
          geistSans.variable, 
          geistMono.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}

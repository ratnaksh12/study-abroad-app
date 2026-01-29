import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'StudyPath - AI Counsellor',
  description: 'Your guided AI companion for study abroad success.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(outfit.className, 'min-h-screen bg-background text-foreground antialiased')}>
        {children}
      </body>
    </html>
  );
}

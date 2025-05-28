
"use client";

import { AppHeader } from '@/components/layout/AppHeader';
// Toaster is now in root layout, AuthProvider is also in root layout.
import { useAuth } from '@/contexts/AuthContext'; // Changed from '@/hooks/useAuth' to direct context for clarity
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Or a minimal loading/redirecting state, router.push handles it
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1">
        {children}
      </main>
      {/* <Toaster /> Toaster is now in root layout */}
    </div>
  );
}

// Renamed from AppLayoutWithAuthProvider as AuthProvider is now in root.
export default function AppPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // AuthProvider is no longer needed here, it's in the root layout
  return (
    <ProtectedLayout>{children}</ProtectedLayout>
  );
}

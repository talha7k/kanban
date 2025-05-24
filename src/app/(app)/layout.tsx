
"use client";

import { AppHeader } from '@/components/layout/AppHeader';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
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
      <Toaster />
    </div>
  );
}


export default function AppLayoutWithAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedLayout>{children}</ProtectedLayout>
    </AuthProvider>
  );
}

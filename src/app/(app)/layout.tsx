
"use client";

import { AppHeader } from '@/components/layout/AppHeader';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { TeamId } from '@/lib/types';


function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [selectedTeamId, setSelectedTeamId] = useState<TeamId | null>(null);
  const [teamLoading, setTeamLoading] = useState(true);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    } else if (currentUser) {
      const loadSelectedTeam = async () => {
        try {
          const storedTeamId = localStorage.getItem('selectedTeamId');
          if (storedTeamId) {
            setSelectedTeamId(storedTeamId);
          }
        } catch (e) {
          console.error('Failed to load selected team from storage', e);
        } finally {
          setTeamLoading(false);
        }
      };
      loadSelectedTeam();
    }
  }, [currentUser, loading, router]);

  // Handle team selection navigation
  useEffect(() => {
    if (!loading && !teamLoading && currentUser && !selectedTeamId) {
      // Only redirect to teams if we're not already on the teams page
      if (window.location.pathname !== '/teams') {
        router.push('/teams');
      }
    }
  }, [currentUser, loading, teamLoading, selectedTeamId, router]);

  const handleTeamSelected = async (teamId: TeamId) => {
    setSelectedTeamId(teamId);
    localStorage.setItem('selectedTeamId', teamId);
  };

  const handleTeamCreated = async (teamId: TeamId) => {
    setSelectedTeamId(teamId);
    localStorage.setItem('selectedTeamId', teamId);
  };

  if (loading || teamLoading) {
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

  // Allow teams page to render even without selectedTeamId
  const isTeamsPage = typeof window !== 'undefined' && window.location.pathname === '/teams';
  if (!selectedTeamId && !isTeamsPage) {
    return null; // Navigation handled by useEffect
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

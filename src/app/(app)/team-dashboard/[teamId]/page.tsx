'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { getTeam } from '@/lib/firebaseTeam';
import { Team } from '@/lib/types';

export default function TeamDashboardPage() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get('teamId');
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamId) {
      const fetchTeam = async () => {
        try {
          const fetchedTeam = await getTeam(teamId as string);
          setTeam(fetchedTeam);
        } catch (error) {
          console.error('Error fetching team:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchTeam();
    }
  }, [teamId]);

  if (loading) {
    return (
      <div style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <p>Loading team data...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <p>Team not found or an error occurred.</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: 20 }}>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Team Dashboard</h1>
      <p style={{ fontSize: 18, marginBottom: 5 }}>Team Name: {team.name}</p>
      <p style={{ fontSize: 16 }}>Team Description: {team.description}</p>
      {/* Add more dashboard content here */}
    </div>
  );
}
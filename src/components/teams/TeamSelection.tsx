import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTeamsForUser, createTeam } from '@/lib/firebaseTeam';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import type { Team, UserId } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TeamSelectionProps {
  onTeamSelected: (teamId: string) => void;
  onTeamCreated: (teamId: string) => void;
}

const TeamSelection: React.FC<TeamSelectionProps> = ({ onTeamSelected, onTeamCreated }) => {
  const { currentUser } = useAuth();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [createTeamDialogVisible, setCreateTeamDialogVisible] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      if (currentUser?.uid) {
        setLoading(true);
        try {
          const userTeams = await getTeamsForUser(currentUser.uid as UserId);
          setTeams(userTeams);
        } catch (err) {
          console.error('Error fetching teams:', err);
          setError('Failed to load teams. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchTeams();
  }, [currentUser]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      setError('Team name cannot be empty.');
      return;
    }
    if (!currentUser?.uid) {
      setError('User not authenticated.');
      return;
    }

    try {
      setError(null);
      const createdTeam = await createTeam(newTeamName, currentUser.uid as UserId, newTeamDescription);
      setTeams(prev => [...prev, createdTeam]);
      onTeamCreated(createdTeam.id);
      setCreateTeamDialogVisible(false);
      setNewTeamName('');
      setNewTeamDescription('');
    } catch (err) {
      console.error('Error creating team:', err);
      setError('Failed to create team. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-5 bg-background flex items-center justify-center">
        <p className="text-lg">Loading teams...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-5 bg-background">
      <ScrollArea className="h-full w-full">
        <div className="flex flex-col items-center justify-center py-10">
          <h2 className="text-3xl font-bold mb-8 text-center">Select a Team</h2>
          {teams.length === 0 ? (
            <p className="text-center text-lg mb-5">You are not a member of any teams yet. Create one to get started!</p>
          ) : (
            teams.map(team => (
              <Card key={team.id} className="w-full max-w-md mb-4 shadow-md cursor-pointer" onClick={() => onTeamSelected(team.id)}>
                <CardHeader>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>{team.description || 'No description provided.'}</CardDescription>
                </CardHeader>
              </Card>
            ))
          )}
          <Button className="mt-5 w-4/5 max-w-xs" onClick={() => setCreateTeamDialogVisible(true)}>
            Create New Team
          </Button>
        </div>
      </ScrollArea>

      <Dialog open={createTeamDialogVisible} onOpenChange={setCreateTeamDialogVisible}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
                  </DialogHeader>
                  {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                  <div className="mb-4">
                    <Label htmlFor="teamName">Team Name</Label>
                    <Input
                      id="teamName"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Enter team name"
                      className="mt-1"
                    />
                  </div>
                  <div className="mb-4">
                    <Label htmlFor="teamDescription">Description (Optional)</Label>
                    <Textarea
                      id="teamDescription"
                      value={newTeamDescription}
                      onChange={(e) => setNewTeamDescription(e.target.value)}
                      placeholder="Enter team description"
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateTeamDialogVisible(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTeam}>
                      Create
                    </Button>
                  </DialogFooter>
        </DialogContent>
      </Dialog>
     </div>
  );
};



export default TeamSelection;
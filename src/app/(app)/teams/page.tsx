import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getTeamsForUser, createTeam } from '@/lib/firebaseTeam';
import type { Team, UserId } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';


export default function TeamsPage() {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  const fetchTeams = useCallback(async () => {
    if (!currentUser?.uid) return;
    setIsLoading(true);
    try {
      const userTeams = await getTeamsForUser(currentUser.uid);
      setTeams(userTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load teams.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.uid, toast]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Team name cannot be empty.',
      });
      return;
    }
    if (!currentUser?.uid) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to create a team.',
      });
      return;
    }

    setIsCreatingTeam(true);
    try {
      const newTeam = await createTeam(newTeamName, currentUser.uid);
      setTeams((prevTeams) => [...prevTeams, newTeam]);
      setNewTeamName('');
      setIsCreateTeamDialogOpen(false);
      toast({
        title: 'Team Created!',
        description: `Team "${newTeam.name}" has been successfully created.`, 
      });
    } catch (error) {
      console.error('Error creating team:', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not create team.';
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: errorMessage,
      });
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleSelectTeam = async (teamId: string) => {
    // Store the selected team in local storage
    localStorage.setItem('selectedTeamId', teamId);
    router.push(`/team-dashboard?teamId=${teamId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading teams...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Teams</h1>
        <Button onClick={() => setIsCreateTeamDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <p className="text-center text-gray-500">No teams found. Create one to get started!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <CardTitle>{team.name}</CardTitle>
              </CardHeader>
<CardContent className="flex flex-col items-center justify-center p-4">
              <h3 className="text-lg font-semibold">{team.name}</h3>
              <p className="text-sm text-gray-500">{team.memberIds.length} Members</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => handleSelectTeam(team.id)}
              >
                View Details
              </Button>
            </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateTeamDialogOpen} onOpenChange={setIsCreateTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teamName" className="text-right">
                Team Name
              </Label>
              <Input
                id="teamName"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTeamDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeam} disabled={isCreatingTeam}>
              {isCreatingTeam ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
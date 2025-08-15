'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getTeam, updateTeam, addMemberToTeam } from '@/lib/firebaseTeam';
import { getUserProfileByEmail } from '@/lib/firebaseUser';
import type { Team, UserId } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserPlus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useParams } from 'next/navigation';

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditTeamDialogOpen, setIsEditTeamDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  const fetchTeamDetails = useCallback(async () => {
    if (!teamId || !currentUser?.uid) return;
    setIsLoading(true);
    try {
      const fetchedTeam = await getTeam(teamId as string);
      setTeam(fetchedTeam);
      if (fetchedTeam) {
        setNewTeamName(fetchedTeam.name);
        setNewTeamDescription(fetchedTeam.description || '');
      }
    } catch (error) {
      console.error('Error fetching team details:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load team details.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [teamId, currentUser?.uid, toast]);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchTeamDetails();
    }
  }, [fetchTeamDetails, currentUser?.uid]);

  // Authentication guard
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  const handleUpdateTeam = async () => {
    if (!team || !currentUser) return;
    setIsUpdatingTeam(true);
    try {
      await updateTeam(team.id, { name: newTeamName, description: newTeamDescription });
      setTeam((prev: Team | null) => (prev ? { ...prev, name: newTeamName, description: newTeamDescription } : null));
      setIsEditTeamDialogOpen(false);
      toast({
        title: 'Team Updated!',
        description: 'Team details have been successfully updated.',
      });
    } catch (error) {
      console.error('Error updating team:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update team.',
      });
    } finally {
      setIsUpdatingTeam(false);
    }
  };

  const handleAddMember = async () => {
    if (!team || !memberEmail.trim()) return;
    setIsAddingMember(true);
    try {
      const userProfile = await getUserProfileByEmail(memberEmail);
      if (!userProfile) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'User with this email not found.',
        });
        return;
      }
      await addMemberToTeam(team.id, userProfile.id);
      setTeam((prev: Team | null) => (prev ? { ...prev, memberIds: [...prev.memberIds, userProfile.id] } : null));
      setMemberEmail('');
      setIsAddMemberDialogOpen(false);
      toast({
        title: 'Member Added!',
        description: `${userProfile.name} has been added to the team.`, 
      });
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        variant: 'destructive',
        title: 'Add Member Failed',
        description: 'Could not add member to team.',
      });
    } finally {
      setIsAddingMember(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading team details...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Team not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{team.name}</h1>
        <div>
          <Button onClick={() => setIsEditTeamDialogOpen(true)} className="mr-2">
            Edit Team
          </Button>
          <Button onClick={() => setIsAddMemberDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Add Member
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Description:</strong> {team.description || 'N/A'}</p>
          <p><strong>Created By:</strong> {team.createdBy}</p>
          <p><strong>Created At:</strong> {new Date(team.createdAt).toLocaleDateString()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members ({team.memberIds.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {team.memberIds.length === 0 ? (
            <p className="text-gray-500">No members in this team yet.</p>
          ) : (
            <ul>
              {team.memberIds.map((memberId) => (
                <li key={memberId} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <span>{memberId}</span> {/* Replace with actual user name later */}
                  {/* <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button> */}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Edit Team Dialog */}
      <Dialog open={isEditTeamDialogOpen} onOpenChange={setIsEditTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teamName" className="text-right">
                Team Name
              </Label>
              <Input
                id="teamName"
                value={newTeamName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeamName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teamDescription" className="text-right">
                Description
              </Label>
              <Input
                id="teamDescription"
                value={newTeamDescription}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeamDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTeamDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTeam} disabled={isUpdatingTeam}>
              {isUpdatingTeam ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="memberEmail" className="text-right">
                Member Email
              </Label>
              <Input
                id="memberEmail"
                type="email"
                value={memberEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemberEmail(e.target.value)}
                className="col-span-3"
                placeholder="Enter user's email address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={isAddingMember}>
              {isAddingMember ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
 import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getTeam, addMemberToTeam, removeMemberFromTeam, updateTeam } from '@/lib/firebaseTeam';
import type { Team, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlusCircle, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function ManageTeamPage() {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { teamId } = useParams();

  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [editedTeamName, setEditedTeamName] = useState('');
  const [editedTeamDescription, setEditedTeamDescription] = useState('');

  const fetchTeamDetails = useCallback(async () => {
    if (!teamId || typeof teamId !== 'string') {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Invalid team ID.',
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const fetchedTeam = await getTeam(teamId);
      if (fetchedTeam) {
        setTeam(fetchedTeam);
        setEditedTeamName(fetchedTeam.name);
        setEditedTeamDescription(fetchedTeam.description || '');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Team not found.',
        });
        router.back();
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
  }, [teamId, toast, router]);

  useEffect(() => {
    fetchTeamDetails();
  }, [fetchTeamDetails]);

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Email cannot be empty.',
      });
      return;
    }
    if (!team?.id) return;

    setIsAddingMember(true);
    try {
      await addMemberToTeam(team.id, newMemberEmail);
      toast({
        title: 'Member Added',
        description: `Member with email ${newMemberEmail} has been added.`, 
      });
      setNewMemberEmail('');
      setIsAddMemberDialogOpen(false);
      fetchTeamDetails(); // Re-fetch team details to update member list
    } catch (error) {
      console.error('Error adding member:', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not add member.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!team?.id) return;
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await removeMemberFromTeam(team.id, memberId);
      toast({
        title: 'Member Removed',
        description: 'Member has been removed from the team.',
      });
      fetchTeamDetails(); // Re-fetch team details to update member list
    } catch (error) {
      console.error('Error removing member:', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not remove member.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    }
  };

  const handleUpdateTeamDetails = async () => {
    if (!team?.id) return;
    if (!editedTeamName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Team name cannot be empty.',
      });
      return;
    }

    try {
      await updateTeam(team.id, { name: editedTeamName, description: editedTeamDescription });
      toast({
        title: 'Team Updated',
        description: 'Team details have been updated.',
      });
      setIsEditingTeam(false);
      fetchTeamDetails(); // Re-fetch team details to update displayed info
    } catch (error) {
      console.error('Error updating team:', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not update team.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    }
  };

  const isOwner = currentUser?.uid === team?.ownerId;

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
        <p className="text-lg">Team not found or an error occurred.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage {team.name}</h1>
        {isOwner && (
          <Button onClick={() => setIsEditingTeam(true)}>
            <Edit className="mr-2 h-4 w-4" /> Edit Team Details
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Name:</strong> {team.name}</p>
          <p><strong>Description:</strong> {team.description || 'N/A'}</p>
          <p><strong>Owner:</strong> {team.ownerId === currentUser?.uid ? 'You' : team.ownerId}</p>
          <p><strong>Created At:</strong> {team.createdAt && typeof team.createdAt === 'object' && 'seconds' in (team.createdAt as { seconds: number }) ? new Date((team.createdAt as { seconds: number }).seconds * 1000).toLocaleDateString() : 'N/A'}</p>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Team Members</h2>
        {isOwner && (
          <Button onClick={() => setIsAddMemberDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Member
          </Button>
        )}
      </div>

      {team.members && team.members.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.members.map((member) => (
            <Card key={member.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
                {isOwner && member.id !== currentUser?.uid && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No members in this team yet.</p>
      )}

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="memberEmail" className="text-right">
                Member Email
              </Label>
              <Input
                id="memberEmail"
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="col-span-3"
                placeholder="member@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsAddMemberDialogOpen(false)} variant="outline">Cancel</Button>
            <Button onClick={handleAddMember} disabled={isAddingMember}>
              {isAddingMember ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Details Dialog */}
      <Dialog open={isEditingTeam} onOpenChange={setIsEditingTeam}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTeamName" className="text-right">
                Team Name
              </Label>
              <Input
                id="editTeamName"
                value={editedTeamName}
                onChange={(e) => setEditedTeamName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTeamDescription" className="text-right">
                Description
              </Label>
              <Input
                id="editTeamDescription"
                value={editedTeamDescription}
                onChange={(e) => setEditedTeamDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsEditingTeam(false)} variant="outline">Cancel</Button>
            <Button onClick={handleUpdateTeamDetails}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
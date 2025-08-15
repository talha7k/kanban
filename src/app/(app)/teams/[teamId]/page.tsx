'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getTeam, updateTeam, addMemberToTeam, removeMemberFromTeam, deleteTeam, getTeamMembers } from '@/lib/firebaseTeam';
import { getUserProfileByEmail, getUserProfile } from '@/lib/firebaseUser';
import { getProjectsForTeam } from '@/lib/firebaseProject';
import type { Team, UserId, UserProfile, Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserPlus, Trash2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useParams } from 'next/navigation';

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [team, setTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [teamProjects, setTeamProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditTeamDialogOpen, setIsEditTeamDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isDeleteTeamDialogOpen, setIsDeleteTeamDialogOpen] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

  const fetchTeamDetails = useCallback(async () => {
    if (!teamId || !currentUser?.uid) return;
    setIsLoading(true);
    try {
      const [fetchedTeam, members, projects] = await Promise.all([
        getTeam(teamId as string),
        getTeamMembers(teamId as string),
        getProjectsForTeam(teamId as string)
      ]);
      
      setTeam(fetchedTeam);
      setTeamMembers(members);
      setTeamProjects(projects);
      
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

  const handleRemoveMember = async (memberIdToRemove: UserId) => {
    if (!team || !currentUser) return;
    
    // Prevent users from removing themselves
    if (memberIdToRemove === currentUser.uid) {
      toast({
        variant: 'destructive',
        title: 'Cannot Remove Yourself',
        description: 'You cannot remove yourself from the team. Use the delete team option if you want to delete the entire team.',
      });
      return;
    }
    
    // Store the member being removed for potential revert
    const memberToRemove = teamMembers.find(member => member.id === memberIdToRemove);
    
    // Optimistically remove the member from the UI
    setTeam((prev: Team | null) =>
      prev ? { ...prev, memberIds: prev.memberIds.filter((id) => id !== memberIdToRemove) } : null
    );
    setTeamMembers((prev) => prev.filter((member) => member.id !== memberIdToRemove));
    
    try {
      await removeMemberFromTeam(team.id, memberIdToRemove);
      toast({
        title: 'Member Removed!',
        description: 'Member has been successfully removed from the team.',
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        variant: 'destructive',
        title: 'Remove Member Failed',
        description: 'Could not remove member from team.',
      });
      // Revert UI on error
      setTeam((prev: Team | null) =>
        prev ? { ...prev, memberIds: [...prev.memberIds, memberIdToRemove] } : null
      );
      if (memberToRemove) {
        setTeamMembers((prev) => [...prev, memberToRemove]);
      }
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
          title: 'User Not Found',
          description: `No registered user found with email "${memberEmail}". Please ask them to register first or send them an invitation.`,
        });
        return;
      }
      
      // Check if user is already a member
      if (team.memberIds.includes(userProfile.id)) {
        toast({
          variant: 'destructive',
          title: 'Already a Member',
          description: `${userProfile.name} is already a member of this team.`,
        });
        return;
      }
      
      await addMemberToTeam(team.id, userProfile.id);
      
      // Update both team state and members list
      setTeam((prev: Team | null) => (prev ? { ...prev, memberIds: [...prev.memberIds, userProfile.id] } : null));
      setTeamMembers((prev) => [...prev, userProfile]);
      
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

  const handleDeleteTeam = async () => {
    if (!team || !currentUser) return;
    
    // Check if team has projects
    if (teamProjects.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Cannot Delete Team',
        description: `This team has ${teamProjects.length} project(s). Please delete all projects before deleting the team.`,
      });
      return;
    }
    
    setIsDeletingTeam(true);
    try {
      await deleteTeam(team.id);
      toast({
        title: 'Team Deleted!',
        description: 'Team has been successfully deleted.',
      });
      router.push('/teams'); // Redirect to teams page
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        variant: 'destructive',
        title: 'Delete Team Failed',
        description: 'Could not delete team.',
      });
    } finally {
      setIsDeletingTeam(false);
      setIsDeleteTeamDialogOpen(false);
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
          <Button onClick={() => setIsAddMemberDialogOpen(true)} className="mr-2">
            <UserPlus className="mr-2 h-4 w-4" /> Add Member
          </Button>
          {team.ownerId === currentUser?.uid && (
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteTeamDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Team
            </Button>
          )}
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
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex flex-col">
                    <span className="font-medium">{member.name}</span>
                    <span className="text-sm text-gray-600">{member.email}</span>
                  </div>
                  {member.id !== currentUser?.uid && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
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

      {/* Delete Team Dialog */}
      <Dialog open={isDeleteTeamDialogOpen} onOpenChange={setIsDeleteTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Team
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {teamProjects.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  This team cannot be deleted because it has {teamProjects.length} active project(s):
                </p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {teamProjects.slice(0, 5).map((project) => (
                    <li key={project.id}>{project.name}</li>
                  ))}
                  {teamProjects.length > 5 && (
                    <li>...and {teamProjects.length - 5} more</li>
                  )}
                </ul>
                <p className="font-medium text-sm text-gray-600">
                  Please delete all projects before deleting the team.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Are you sure you want to delete the team "{team?.name}"? This action cannot be undone and will remove all team data.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteTeamDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTeam} disabled={isDeletingTeam || teamProjects.length > 0}>
              {isDeletingTeam ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getTeamsForUser, createTeam, getTeam } from "@/lib/firebaseTeam";
import type { Team, UserId } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2, Users } from "lucide-react";
import { TeamCard } from "@/components/teams/TeamCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function TeamsPage() {
  const { currentUser, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  const fetchTeams = useCallback(async () => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userTeams = await getTeamsForUser(currentUser.uid);

      const teamsWithMembers = await Promise.all(userTeams.map(async (team) => {
        const fullTeam = await getTeam(team.id);
        return fullTeam || team;
      }));
      setTeams(teamsWithMembers);

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
    if (!loading && currentUser) {
      fetchTeams();
    } else if (!loading && !currentUser) {
      setIsLoading(false);
    }
  }, [currentUser?.uid, loading]); // Removed fetchTeams from dependencies to prevent duplicate calls

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Team name cannot be empty.",
      });
      return;
    }
    if (!currentUser?.uid) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create a team.",
      });
      return;
    }

    setIsCreatingTeam(true);
    try {
      const newTeam = await createTeam(
        newTeamName,
        currentUser.uid,
        newTeamDescription
      );
      setTeams((prevTeams) => [...prevTeams, newTeam]);
      setNewTeamName("");
      setNewTeamDescription("");
      setIsCreateTeamDialogOpen(false);
      toast({
        title: "Team Created!",
        description: `Team "${newTeam.name}" has been successfully created.`,
      });
    } catch (error) {
      console.error("Error creating team:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Could not create team.";
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: errorMessage,
      });
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleSelectTeam = async (teamId: string) => {
    try {
      // Store the selected team in local storage
      localStorage.setItem("selectedTeamId", teamId);

      // Add a small delay to ensure localStorage is updated
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Navigate to team dashboard
      router.push("/team-dashboard");

      toast({
        title: "Team Selected",
        description: "Navigating to team dashboard...",
      });
    } catch (error) {
      console.error("Error selecting team:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not select team.",
      });
    }
  };

  if (isLoading && teams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading teams...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Your Teams
          </h1>
          <p className="text-gray-600 text-sm">
            Manage and collaborate with your teams
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateTeamDialogOpen(true)}
         >
          <PlusCircle className="mr-2 h-4 w-4" /> 
          Create New Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
            <Users className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No teams yet
          </h3>
          <p className="text-gray-500 text-center mb-6 max-w-md">
            Create your first team to start collaborating with others and managing projects together.
          </p>
          <Button 
            onClick={() => setIsCreateTeamDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Your First Team
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard 
              key={team.id} 
              team={team} 
              currentUserId={currentUser?.uid}
              onSelect={handleSelectTeam}
            />
          ))
          }
        </div>
      )}

      <Dialog
        open={isCreateTeamDialogOpen}
        onOpenChange={setIsCreateTeamDialogOpen}
      >
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
            <Button
              variant="outline"
              onClick={() => setIsCreateTeamDialogOpen(false)}
            >
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

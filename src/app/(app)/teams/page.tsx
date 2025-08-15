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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2, Users, Crown, Calendar, Settings, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
    <div className="container mx-auto p-6">
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
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
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
          {teams.map((team) => {
            const isOwner = currentUser?.uid === team.ownerId;
            const memberCount = team.members?.length || team.memberIds?.length || 0;
            
            return (
              <Card
                key={team.id}
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:scale-[1.02] bg-gradient-to-br from-white to-gray-50/50"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {team.name}
                        </CardTitle>
                        {isOwner && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                            <Crown className="w-3 h-3 mr-1" />
                            Owner
                          </Badge>
                        )}
                      </div>
                      {team.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {team.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-4">
                  {/* Team Stats */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">{memberCount}</span>
                        <span className="text-gray-500">
                          {memberCount === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Members Preview */}
                  {team.members && team.members.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Team Members
                      </h4>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {team.members.slice(0, 3).map((member) => (
                          <div key={member.id} className="flex items-center gap-2 text-sm">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                              {member.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="text-gray-700 truncate">{member.name}</span>
                            {member.id === team.ownerId && (
                              <Crown className="w-3 h-3 text-amber-500" />
                            )}
                          </div>
                        ))}
                        {team.members.length > 3 && (
                          <div className="text-xs text-gray-500 pl-8">
                            +{team.members.length - 3} more members
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 group/btn hover:bg-gray-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/teams/${team.id}`);
                      }}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Manage
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 group/btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTeam(team.id);
                      }}
                    >
                      <span>Select</span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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

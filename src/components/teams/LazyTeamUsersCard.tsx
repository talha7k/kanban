"use client";

import { useState, useEffect } from "react";
import { TeamUsersCard } from "./TeamUsersCard";
import { getTeamMembers, getTeam } from "@/lib/firebaseTeam";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile, Team, TeamId, Project } from "@/lib/types";

interface LazyTeamUsersCardProps {
  selectedTeamId: TeamId | null;
  selectedProject: Project | null;
  onClearSelectedProject: () => void;
  onUsersLoaded?: (users: UserProfile[]) => void;
}

export function LazyTeamUsersCard({
  selectedTeamId,
  selectedProject,
  onClearSelectedProject,
  onUsersLoaded,
}: LazyTeamUsersCardProps) {
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!selectedTeamId) {
        setIsLoadingUsers(false);
        return;
      }

      setIsLoadingUsers(true);

      try {
        // Fetch team details and members in parallel
        const [team, fetchedUsers] = await Promise.all([
          getTeam(selectedTeamId),
          getTeamMembers(selectedTeamId),
        ]);

        setSelectedTeam(team);
        setAllUsers(fetchedUsers);
        onUsersLoaded?.(fetchedUsers);
      } catch (error) {
        console.error("Error fetching team data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load team data.",
        });
      } finally {
        setIsLoadingUsers(false);
      }
    };

    // Add a small delay to allow projects to load first
    const timer = setTimeout(fetchTeamData, 200);
    return () => clearTimeout(timer);
  }, [selectedTeamId, toast]);

  return (
    <TeamUsersCard
      isLoadingUsers={isLoadingUsers}
      allUsers={allUsers}
      selectedTeam={selectedTeam}
      selectedProject={selectedProject}
      onClearSelectedProject={onClearSelectedProject}
    />
  );
}
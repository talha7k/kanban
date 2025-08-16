import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Users, Loader2, Crown, Briefcase, ShieldCheck, UserCog } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";
import type { Project, UserProjectRole } from "@/lib/types";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
  title?: string | null;
}

interface Team {
  ownerId: string;
}

interface TeamUsersCardProps {
  isLoadingUsers: boolean;
  allUsers: User[];
  selectedTeam: Team | null;
  selectedProject?: Project | null; // Optional project for viewing project-specific roles
}

export function TeamUsersCard({
  isLoadingUsers,
  allUsers,
  selectedTeam,
  selectedProject,
}: TeamUsersCardProps) {
  // Filter users based on context (team or project)
  const displayUsers = selectedProject 
    ? allUsers.filter(user => 
        user.id === selectedProject.ownerId || 
        selectedProject.memberIds?.includes(user.id)
      )
    : allUsers;

  const getDisplayTitle = () => {
    if (selectedProject) {
      return `Project Members: ${selectedProject.name}`;
    }
    return "Users";
  };

  const getDisplayDescription = () => {
    if (selectedProject) {
      return "Members and their roles in this project.";
    }
    return "Overview of team members.";
  };

  const getUserRole = (user: User): { role: string; variant: "outline" | "default" | "secondary"; icon?: React.ReactNode } => {
    if (selectedProject) {
      // Project context - show project-specific roles
      if (user.id === selectedProject.ownerId) {
        return { role: "Owner", variant: "outline", icon: <Crown className="mr-1.5 h-3.5 w-3.5" /> };
      }
      const projectRole = selectedProject.memberRoles?.[user.id] as UserProjectRole;
      if (projectRole === "manager") {
        return { role: "Manager", variant: "default", icon: <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> };
      }
      return { role: "Member", variant: "secondary", icon: <UserCog className="mr-1.5 h-3.5 w-3.5" /> };
    } else {
      // Team context - only show team owner badge
      if (selectedTeam?.ownerId === user.id) {
        return { role: "Owner", variant: "outline", icon: <Crown className="mr-1.5 h-3.5 w-3.5" /> };
      }
      // For regular team members, show their general role or "Member"
      return { 
        role: user.role ? user.role : "Member", 
        variant: user.role === "admin" ? "default" : "secondary" 
      };
    }
  };
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Users className="mr-3 h-7 w-7 text-accent" />
          {getDisplayTitle()} (
          {isLoadingUsers ? (
            <Loader2 className="h-5 w-5 animate-spin ml-2" />
          ) : (
            displayUsers.length
          )}
          )
        </CardTitle>
        <CardDescription>{getDisplayDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingUsers ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center space-x-3 p-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center space-x-3 p-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        ) : displayUsers.length > 0 ? (
          <ScrollArea className="h-auto max-h-[350px] md:max-h-[500px] pr-4 overflow-y-auto">
            <ul className="space-y-3">
              {displayUsers.map((user) => {
                const userRoleInfo = getUserRole(user);
                return (
                <li
                  key={user.id}
                  className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={user.avatarUrl || undefined}
                      alt={user.name || ""}
                      data-ai-hint="profile avatar"
                    />
                    <AvatarFallback>
                      {user.name?.substring(0, 2).toUpperCase() ||
                        user.email?.substring(0, 2).toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span
                        className="text-sm font-medium text-foreground truncate"
                            title={user.name || ""}
                          >
                            {user.name}
                      </span>
                      <Badge
                        variant={userRoleInfo.variant}
                        className={`capitalize text-xs flex-shrink-0 ${
                          userRoleInfo.variant === "outline" ? "border-accent text-accent" : ""
                        }`}
                      >
                        {userRoleInfo.icon}
                        {userRoleInfo.role}
                      </Badge>
                    </div>
                    <p
                      className="text-xs text-muted-foreground truncate"
                      title={user.email || ""}
                    >
                      {user.email}
                    </p>
                    {user.title && (
                      <p
                        className="text-xs text-muted-foreground flex items-center mt-0.5 truncate"
                        title={user.title}
                      >
                        <Briefcase className="h-3 w-3 mr-1.5 flex-shrink-0" />{" "}
                        {user.title}
                      </p>
                    )}
                  </div>
                </li>
                );
              })}
            </ul>
          </ScrollArea>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            No users found.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
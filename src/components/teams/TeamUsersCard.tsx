import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Users, Loader2, Crown, Briefcase } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";

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
}

export function TeamUsersCard({
  isLoadingUsers,
  allUsers,
  selectedTeam,
}: TeamUsersCardProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Users className="mr-3 h-7 w-7 text-accent" />
          Users (
          {isLoadingUsers ? (
            <Loader2 className="h-5 w-5 animate-spin ml-2" />
          ) : (
            allUsers.length
          )}
          )
        </CardTitle>
        <CardDescription>Overview of team members.</CardDescription>
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
        ) : allUsers.length > 0 ? (
          <ScrollArea className="h-auto max-h-[350px] md:max-h-[500px] pr-4 overflow-y-auto">
            <ul className="space-y-3">
              {allUsers.map((user) => (
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
                      {selectedTeam?.ownerId === user.id ? (
                        <Badge
                          variant="outline"
                          className="ml-2 border-accent text-accent"
                        >
                          <Crown className="mr-1.5 h-3.5 w-3.5" /> Owner
                        </Badge>
                      ) : (
                        <Badge
                          variant={
                            user.role === "admin" ? "default" : "secondary"
                          }
                          className="capitalize text-xs flex-shrink-0"
                        >
                          {user.role ? user.role : "Member"}
                        </Badge>
                      )}
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
              ))}
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
"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Crown, Calendar, Settings, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TeamCardProps = {
  team: Team;
  currentUserId?: string;
  onSelect?: (teamId: string) => void;
};

export function TeamCard({ team, currentUserId, onSelect }: TeamCardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const isOwner = currentUserId === team.ownerId;
  const memberCount = team.members?.length || team.memberIds?.length || 0;

  const handleSelect = (e: React.MouseEvent, teamId: string) => {
    e.stopPropagation();
    onSelect?.(teamId);
  };

  return (
    <Card
      className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:scale-[1.02] bg-gradient-to-br from-white to-gray-50/50 hover:bg-gradient-to-r hover:from-pink-100 hover:to-purple-100"
      onClick={(e) => handleSelect(e, team.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {team.name}
              </CardTitle>
              {isOwner && (
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-800 border-amber-200"
                >
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span className="font-medium">{memberCount}</span>
              <span className="text-gray-500">
                {memberCount === 1 ? "member" : "members"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>
              {team.createdAt
                ? new Date(team.createdAt).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
        </div>

        {team.members && team.members.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Users className="w-4 h-4" />
              Team Members
            </h4>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {team.members.slice(0, 3).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                    {member.name?.charAt(0).toUpperCase() || "U"}
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

        <div className="flex gap-2 pt-2 w-full">
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/teams/${team.id}`);
            }}
          >
            <Settings className="w-4 h-4 mr-1" />
            Manage
          </Button>

        </div>
      </CardContent>
    </Card>
  );
}

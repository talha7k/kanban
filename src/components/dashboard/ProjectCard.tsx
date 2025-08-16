import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlusCircle,
  FolderKanban,
  Loader2,
  Briefcase,
  Settings2,
  Eye,
  Crown,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Project, UserProfile } from "@/lib/types";

interface ProjectCardProps {
  project: Project;
  currentUserUid: string | undefined;
  allUsers: UserProfile[];
  openEditProjectDialog: (project: Project) => void;
  openManageMembersDialog: (project: Project) => void;
  openDeleteProjectDialog: (project: Project) => void;
}

export function ProjectCard({
  project,
  currentUserUid,
  allUsers,
  openEditProjectDialog,
  openManageMembersDialog,
  openDeleteProjectDialog,
}: ProjectCardProps) {
  return (
    <Card
      key={project.id}
      className="bg-primary/5 hover:shadow-lg transition-shadow cursor-pointer hover:bg-gradient-to-r hover:from-pink-100 hover:to-purple-100"
      onClick={() => window.location.href = `/projects/${project.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          {currentUserUid === project.ownerId && (
            <Badge variant="outline" className="ml-2 border-accent text-accent">
              <Crown className="mr-1.5 h-3.5 w-3.5" /> Owner
            </Badge>
          )}
        </div>
        <CardDescription className="line-clamp-2 min-h-[40px] break-words">
          {project.description || "No description available."}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-col items-start space-y-3">
        <div className="flex items-center space-x-2 mb-1">
          {(project.memberIds || []).slice(0, 3).map((memberId) => {
            const member = allUsers.find((u) => u.id === memberId);
            return member ? (
              <Avatar key={member.id} className="h-6 w-6 border-2 border-card">
                <AvatarImage
                  src={member.avatarUrl}
                  alt={member.name}
                  data-ai-hint="profile small"
                />
                <AvatarFallback>
                  {member.name?.substring(0, 1).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            ) : null;
          })}
          {(project.memberIds?.length || 0) > 3 && (
            <Avatar className="h-6 w-6 border-2 border-card">
              <AvatarFallback>
                +{(project.memberIds?.length || 0) - 3}
              </AvatarFallback>
            </Avatar>
          )}
          <span className="text-xs text-muted-foreground">
            {project.memberIds?.length || 0} Member(s)
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentUserUid === project.ownerId && (
            <>

              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditProjectDialog(project)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Button>{" "}
              <Button
                variant="outline"
                size="sm"
                onClick={() => openManageMembersDialog(project)}
              >
                <Settings2 className="mr-1.5 h-3.5 w-3.5" /> Assign Users
              </Button>
            </>
          )}{" "}

        </div>
      </CardFooter>
    </Card>
  );
}

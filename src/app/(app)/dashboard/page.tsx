
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useMockKanbanData } from '@/hooks/use-mock-kanban-data';
import type { NewProjectData, Project, UserProfile } from '@/lib/types';
import { CreateProjectDialog } from '@/components/dashboard/CreateProjectDialog';
import { PlusCircle, Users, FolderKanban } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DashboardPage() {
  const { users, projects, addProject } = useMockKanbanData();
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);

  const handleAddProject = (projectData: NewProjectData) => {
    addProject(projectData);
    // Optionally: show a toast notification
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <Button onClick={() => setIsCreateProjectDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <PlusCircle className="mr-2 h-5 w-5" /> Create New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Projects Section */}
        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <FolderKanban className="mr-3 h-7 w-7 text-primary" />
              Projects ({projects.length})
            </CardTitle>
            <CardDescription>Manage your ongoing and upcoming projects.</CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {projects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription className="line-clamp-2 h-[40px]">{project.description || 'No description available.'}</CardDescription>
                      </CardHeader>
                      <CardFooter>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/projects/${project.id}`}>View Board</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground">No projects yet. Click "Create New Project" to get started.</p>
            )}
          </CardContent>
        </Card>

        {/* Users Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Users className="mr-3 h-7 w-7 text-accent" />
              Users ({users.length})
            </CardTitle>
            <CardDescription>Overview of team members.</CardDescription>
          </CardHeader>
          <CardContent>
            {users.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <ul className="space-y-3">
                  {users.map((user) => (
                    <li key={user.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="profile avatar" />
                        <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{user.name}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground">No users found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateProjectDialog
        isOpen={isCreateProjectDialogOpen}
        onOpenChange={setIsCreateProjectDialogOpen}
        onAddProject={handleAddProject}
      />
    </div>
  );
}

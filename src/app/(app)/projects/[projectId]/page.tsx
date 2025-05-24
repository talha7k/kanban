
"use client";
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { useMockKanbanData, type MockKanbanDataType } from '@/hooks/use-mock-kanban-data';
import type { Project, UserProfile } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  const { users, getProjectById } = useMockKanbanData();
  const [project, setProject] = useState<Project | null | undefined>(undefined); // undefined for loading, null for not found

  useEffect(() => {
    if (params.projectId) {
      const foundProject = getProjectById(params.projectId);
      setProject(foundProject || null); // Set to null if not found
    }
  }, [params.projectId, getProjectById]);

  if (project === undefined) { // Loading state
    return <div className="flex items-center justify-center h-full text-muted-foreground">Loading project data...</div>;
  }

  if (!project) { // Project not found
    return <div className="flex items-center justify-center h-full text-destructive">Project not found: {params.projectId}</div>;
  }

  return (
    <div className="h-full">
      <KanbanBoard project={project} users={users} />
    </div>
  );
}

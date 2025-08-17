
"use client";

import type { Project, Column, Task, UserProfile, ColumnId, TaskId, NewTaskData, NewCommentData, UserProjectRole } from '@/lib/types';
import { KanbanColumn } from './KanbanColumn';
import { AddTaskDialog } from './AddTaskDialog';
import { EditTaskDialog } from './EditTaskDialog';
import { TaskDetailsDialog } from './TaskDetailsDialog';
import { TaskCard } from './TaskCard';
import { useState, useEffect, useMemo } from 'react';
import type { TaskFormData } from './TaskFormFields';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, ListFilter, UserCheck, PlusCircleIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/hooks/useAuth';
import {
  DndContext,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useTaskManagement } from '@/hooks/useTaskManagement';

interface KanbanBoardProps {
  project: Project;
  users: UserProfile[];
}

export function KanbanBoard({ project: initialProject, users }: KanbanBoardProps) {
  const [projectData, setProjectData] = useState<Project>(initialProject);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [isTaskDetailsDialogOpen, setIsTaskDetailsDialogOpen] = useState(false);
  const [selectedColumnIdForNewTask, setSelectedColumnIdForNewTask] = useState<ColumnId | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskViewFilter, setTaskViewFilter] = useState<'all' | 'mine'>('all');

  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setProjectData(initialProject);
  }, [initialProject]);

  const isOwner = useMemo(() => currentUser?.uid === projectData.ownerId, [currentUser, projectData.ownerId]);
  
  const currentUserProjectRole = useMemo((): UserProjectRole | null => {
    if (!currentUser || !projectData.memberRoles) return null;
    if (isOwner) return 'manager'; 
    return projectData.memberRoles[currentUser.uid] || null;
  }, [currentUser, projectData.memberRoles, isOwner]);

  const canManageTasks = useMemo(() => isOwner || currentUserProjectRole === 'manager', [isOwner, currentUserProjectRole]);

  // Initialize custom hooks
  const { dragHandlers, sensors, activeId, activeTask } = useDragAndDrop(
    projectData.tasks,
    (tasks) => setProjectData(prev => ({ ...prev!, tasks })),
    currentUser?.uid || ''
  );

  const {
    taskToEdit,
    setTaskToEdit,
    taskToView,
    setTaskToView,
    showDeleteConfirm,
    setShowDeleteConfirm,
    taskToDeleteId,
    setTaskToDeleteId,
    handleAddTask,
    handleEditTask,
    handleUpdateTask,
    handleDeleteTask,
    handleAddComment,
  } = useTaskManagement(
    projectData.tasks,
    (tasks) => setProjectData(prev => ({ ...prev!, tasks })),
    projectData.id,
    currentUser?.uid || ''
  );

  const assignableUsers = useMemo(() => {
    if (!projectData || !users) return [];
    const projectMemberAndOwnerIds = new Set<string>([
      projectData.ownerId,
      ...(projectData.memberIds || [])
    ]);
    return users.filter(user => projectMemberAndOwnerIds.has(user.id));
  }, [projectData, users]);

  const filteredTasks = useMemo(() => {
    if (!projectData || !currentUser) return [];
    const tasksToFilter = projectData.tasks || [];
    if (taskViewFilter === 'mine') {
      return tasksToFilter.filter(task => task.assigneeUids?.includes(currentUser.uid));
    }
    return tasksToFilter;
  }, [projectData, currentUser, taskViewFilter]);

  if (!projectData || !users) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading project board...
      </div>
    );
  }

  const allTasksForDependencies = projectData.tasks.map(t => ({ id: t.id, title: t.title }));

  const handleAddTaskWrapper = async (taskData: TaskFormData, columnId: string) => {
    setIsSubmitting(true);
    try {
      await handleAddTask(taskData, columnId);
      setIsAddTaskDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTaskWrapper = async (taskId: string, taskData: TaskFormData) => {
    setIsSubmitting(true);
    try {
      await handleEditTask(taskId, taskData);
      setIsEditTaskDialogOpen(false);
      setTaskToEdit(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTaskWrapper = async () => {
    if (!taskToDeleteId) return;
    setIsSubmitting(true);
    try {
      await handleDeleteTask(taskToDeleteId);
      setShowDeleteConfirm(false);
      setTaskToDeleteId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    setTaskToView(task);
    setIsTaskDetailsDialogOpen(true);
  };

  const handleTaskEdit = (task: Task) => {
    setTaskToEdit(task);
    setIsEditTaskDialogOpen(true);
  };

  const handleTaskDelete = (taskId: TaskId) => {
    setTaskToDeleteId(taskId);
    setShowDeleteConfirm(true);
  };

  const handleAddCommentWrapper = async (taskId: string, commentText: string) => {
    const commentData = {
      userId: currentUser?.uid || '',
      userName: userProfile?.name || userProfile?.email || 'Anonymous',
      content: commentText,
      ...(userProfile?.avatarUrl && { avatarUrl: userProfile.avatarUrl }),
    };
    await handleAddComment(taskId, commentData);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{projectData.name}</h1>
          <div className="flex items-center gap-2">
            <Button
              variant={taskViewFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTaskViewFilter('all')}
              className="flex items-center gap-2"
            >
              <ListFilter className="h-4 w-4" />
              All Tasks
            </Button>
            <Button
              variant={taskViewFilter === 'mine' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTaskViewFilter('mine')}
              className="flex items-center gap-2"
            >
              <UserCheck className="h-4 w-4" />
              My Tasks
            </Button>
          </div>
        </div>
        {canManageTasks && (
          <Button
            onClick={() => {
              setSelectedColumnIdForNewTask(projectData.columns[0]?.id || null);
              setIsAddTaskDialogOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={dragHandlers.handleDragStart}
          onDragOver={dragHandlers.handleDragOver}
          onDragEnd={dragHandlers.handleDragEnd}
        >
          <div className="h-full overflow-x-auto">
            <div className="flex gap-6 p-6 h-full min-w-max">
              {projectData.columns.map((column) => {
                const columnTasks = filteredTasks.filter(task => task.columnId === column.id);
                return (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    tasks={columnTasks}
                    users={assignableUsers}
                    projectColumns={projectData.columns}
                    canManageTasks={canManageTasks}
                    onAddTask={(columnId: string) => {
                        if (canManageTasks) {
                          setSelectedColumnIdForNewTask(columnId);
                          setIsAddTaskDialogOpen(true);
                        }
                      }}
                    onEditTask={handleTaskEdit}
                    onDeleteTask={handleTaskDelete}
                    onViewTaskDetails={handleTaskClick}
                    onMoveToNextColumn={() => {}}
                    onMoveToPreviousColumn={() => {}}
                    onUpdateTask={handleUpdateTask}
                    isSubmitting={isSubmitting}
                  />
                );
              })}
            </div>
          </div>
          <DragOverlay>
            {activeTask ? (
              <TaskCard
                task={activeTask}
                users={assignableUsers}
                projectColumns={projectData.columns}
                canManageTask={canManageTasks}
                onEdit={() => {}}
                onDelete={() => {}}
                onViewDetails={() => {}}
                onMoveToNextColumn={() => {}}
                onMoveToPreviousColumn={() => {}}
                onUpdateTask={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Dialogs */}
      <AddTaskDialog
        isOpen={isAddTaskDialogOpen}
        onOpenChange={setIsAddTaskDialogOpen}
        onAddTask={handleAddTaskWrapper}
        columnId={selectedColumnIdForNewTask}
        assignableUsers={assignableUsers}
        allTasksForDependencies={allTasksForDependencies}
        isSubmitting={isSubmitting}
      />

      <EditTaskDialog
        isOpen={isEditTaskDialogOpen}
        onOpenChange={(open) => {
          setIsEditTaskDialogOpen(open);
          if (!open) setTaskToEdit(null);
        }}
        onEditTask={handleEditTaskWrapper}
        taskToEdit={taskToEdit}
        assignableUsers={assignableUsers}
        allTasksForDependencies={allTasksForDependencies}
        isSubmitting={isSubmitting}
      />

      <TaskDetailsDialog
        isOpen={isTaskDetailsDialogOpen}
        onOpenChange={(open) => {
          setIsTaskDetailsDialogOpen(open);
          if (!open) setTaskToView(null);
        }}
        task={taskToView}
        users={assignableUsers}
        canManageTask={canManageTasks}
        onAddComment={handleAddCommentWrapper}
        onEditTask={canManageTasks ? handleTaskEdit : () => {}}
        onDeleteTask={canManageTasks ? handleTaskDelete : () => {}}
        isSubmittingComment={isSubmitting}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteConfirm(false);
              setTaskToDeleteId(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTaskWrapper}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    

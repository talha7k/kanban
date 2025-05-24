
import type { Project, UserProfile, Column, Task } from '@/lib/types';
import { useState, useEffect } from 'react';

const mockUsers: UserProfile[] = [
  { id: 'user1', name: 'Alice Wonderland', avatarUrl: 'https://placehold.co/40x40.png?text=AW' },
  { id: 'user2', name: 'Bob The Builder', avatarUrl: 'https://placehold.co/40x40.png?text=BB' },
  { id: 'user3', name: 'Charlie Brown', avatarUrl: 'https://placehold.co/40x40.png?text=CB' },
  { id: 'user4', name: 'Diana Prince', avatarUrl: 'https://placehold.co/40x40.png?text=DP' },
];

const projectAlphaTasks: Task[] = [
  {
    id: 'task-pA-1',
    projectId: 'project-alpha',
    title: 'Setup project repository (Alpha)',
    description: 'Initialize Git repo and push to remote for Project Alpha.',
    priority: 'HIGH',
    columnId: 'col-pA-1', // To Do
    order: 0,
    assigneeUids: ['user1'],
    reporterId: 'user2',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tags: ['setup', 'devops'],
    comments: [
      { id: 'comment-pA-1', userId: 'user2', userName: 'Bob The Builder', content: 'Almost done with Alpha repo!', createdAt: new Date().toISOString(), avatarUrl: mockUsers.find(u=>u.id==='user2')?.avatarUrl },
    ],
    dependentTaskTitles: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-pA-2',
    projectId: 'project-alpha',
    title: 'Design landing page mockups (Alpha)',
    description: 'Create Figma mockups for the main landing page of Alpha.',
    priority: 'MEDIUM',
    columnId: 'col-pA-1', // To Do
    order: 1,
    assigneeUids: ['user3'],
    reporterId: 'user1',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tags: ['design', 'ui'],
    dependentTaskTitles: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-pA-3',
    projectId: 'project-alpha',
    title: 'Implement authentication (Alpha)',
    description: 'Integrate Firebase Auth for Alpha project.',
    priority: 'HIGH',
    columnId: 'col-pA-2', // In Progress
    order: 0,
    assigneeUids: ['user1', 'user2'],
    reporterId: 'user3',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tags: ['feature', 'backend'],
    dependentTaskTitles: ['Setup project repository (Alpha)'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const projectAlphaColumns: Column[] = [
  { id: 'col-pA-1', title: 'To Do (Alpha)', taskIds: ['task-pA-1', 'task-pA-2'], order: 0 },
  { id: 'col-pA-2', title: 'In Progress (Alpha)', taskIds: ['task-pA-3'], order: 1 },
  { id: 'col-pA-3', title: 'Done (Alpha)', taskIds: [], order: 2 },
];


const projectBetaTasks: Task[] = [
   {
    id: 'task-pB-1',
    projectId: 'project-beta',
    title: 'Market Research for Beta Product',
    description: 'Analyze competitor landscape for the Beta product line.',
    priority: 'HIGH',
    columnId: 'col-pB-1', // To Do
    order: 0,
    assigneeUids: ['user3'],
    reporterId: 'user2',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tags: ['research', 'strategy'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
   {
    id: 'task-pB-2',
    projectId: 'project-beta',
    title: 'Develop Beta Prototype',
    description: 'Build the first working prototype for the Beta product.',
    priority: 'MEDIUM',
    columnId: 'col-pB-2', // In Progress
    order: 0,
    assigneeUids: ['user2'],
    reporterId: 'user3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const projectBetaColumns: Column[] = [
  { id: 'col-pB-1', title: 'Planning (Beta)', taskIds: ['task-pB-1'], order: 0 },
  { id: 'col-pB-2', title: 'Development (Beta)', taskIds: ['task-pB-2'], order: 1 },
  { id: 'col-pB-3', title: 'Testing (Beta)', taskIds: [], order: 2 },
  { id: 'col-pB-4', title: 'Launched (Beta)', taskIds: [], order: 3 },
];


const mockProjects: Project[] = [
  {
    id: 'project-alpha',
    name: 'Project Alpha Development',
    description: 'The main development stream for product Alpha.',
    ownerId: 'user1',
    columns: projectAlphaColumns,
    tasks: projectAlphaTasks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'project-beta',
    name: 'Project Beta Initiative',
    description: 'New product initiative Beta.',
    ownerId: 'user3',
    columns: projectBetaColumns,
    tasks: projectBetaTasks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'project-gamma', // Example of a project with no tasks/columns yet
    name: 'Project Gamma (Upcoming)',
    description: 'Future project, currently in planning.',
    ownerId: 'user1',
    columns: [
        { id: 'col-pG-1', title: 'Backlog', taskIds: [], order: 0 },
        { id: 'col-pG-2', title: 'Selected for Dev', taskIds: [], order: 1 },
    ],
    tasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export interface MockKanbanDataType {
  users: UserProfile[];
  projects: Project[];
  getProjectById: (projectId: string) => Project | undefined;
}

export function useMockKanbanData(): MockKanbanDataType {
  const [users, setUsersState] = useState<UserProfile[]>(mockUsers);
  const [projects, setProjectsState] = useState<Project[]>(mockProjects);

  // Simulate fetching data - in a real app, this would be an API call
  useEffect(() => {
    setUsersState(mockUsers);
    setProjectsState(mockProjects);
  }, []);

  const getProjectById = (projectId: string): Project | undefined => {
    return projects.find(p => p.id === projectId);
  };

  return { users, projects, getProjectById };
}

import type { Board, Column, Task, UserProfile } from '@/lib/types';
import { useState, useEffect } from 'react';

const initialUsers: UserProfile[] = [
  { id: 'user1', name: 'Alice Wonderland', avatarUrl: 'https://placehold.co/40x40.png?text=AW' },
  { id: 'user2', name: 'Bob The Builder', avatarUrl: 'https://placehold.co/40x40.png?text=BB' },
  { id: 'user3', name: 'Charlie Brown', avatarUrl: 'https://placehold.co/40x40.png?text=CB' },
];

const initialTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Setup project repository',
    description: 'Initialize Git repo and push to remote.',
    priority: 'HIGH',
    columnId: 'col-1',
    order: 0,
    assigneeUids: ['user1'],
    reporterId: 'user2',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
    tags: ['setup', 'devops'],
    comments: [
      { id: 'comment-1', userId: 'user2', userName: 'Bob The Builder', content: 'Almost done!', createdAt: new Date().toISOString(), avatarUrl: 'https://placehold.co/32x32.png?text=BB' },
    ],
    dependentTaskTitles: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Design landing page mockups',
    description: 'Create Figma mockups for the main landing page.',
    priority: 'MEDIUM',
    columnId: 'col-1',
    order: 1,
    assigneeUids: ['user3'],
    reporterId: 'user1',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    tags: ['design', 'ui'],
    dependentTaskTitles: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Implement authentication module',
    description: 'Integrate Firebase Auth for user login and registration.',
    priority: 'HIGH',
    columnId: 'col-2',
    order: 0,
    assigneeUids: ['user1', 'user2'],
    reporterId: 'user3',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days from now
    tags: ['feature', 'backend'],
    dependentTaskTitles: ['Setup project repository'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-4',
    title: 'Write API documentation',
    description: 'Document all backend API endpoints using Swagger/OpenAPI.',
    priority: 'LOW',
    columnId: 'col-3',
    order: 0,
    assigneeUids: ['user2'],
    reporterId: 'user1',
    dependentTaskTitles: ['Implement authentication module'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialColumns: Column[] = [
  { id: 'col-1', title: 'To Do', taskIds: ['task-1', 'task-2'], order: 0 },
  { id: 'col-2', title: 'In Progress', taskIds: ['task-3'], order: 1 },
  { id: 'col-3', title: 'Done', taskIds: ['task-4'], order: 2 },
];

const initialBoard: Board = {
  id: 'main',
  name: 'Main Project Board',
  columns: initialColumns,
  tasks: initialTasks,
};

export function useMockKanbanData() {
  const [board, setBoard] = useState<Board | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    // Simulate fetching data
    setBoard(initialBoard);
    setUsers(initialUsers);
  }, []);

  return { board, setBoard, users };
}

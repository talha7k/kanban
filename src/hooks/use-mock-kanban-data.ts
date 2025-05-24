
import type { Project, UserProfile, Column, Task, NewProjectData, UserId } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';

// Mock users are now primarily illustrative, actual user data comes from Firestore.
const mockUsers: UserProfile[] = [];

// Project-related mock data is removed as it will come from Firestore.
const initialMockProjects: Project[] = [];

export interface MockKanbanDataType {
  users: UserProfile[]; // This might be used as a fallback or for non-logged-in views.
  // Project-related functions are removed as they are handled by firebaseService.
}

// This hook's role is significantly reduced. It might only provide initial static data
// or be phased out entirely in favor of direct Firestore calls in components.
export function useMockKanbanData(): MockKanbanDataType {
  const [users, setUsersState] = useState<UserProfile[]>(mockUsers);

  useEffect(() => {
    // For now, keeps the mock users, but projects are fetched from Firestore.
    setUsersState(mockUsers);
  }, []);

  // Project-related functions (getProjectById, addProject) are removed.
  // Components will use firebaseService for these.

  return { users };
}

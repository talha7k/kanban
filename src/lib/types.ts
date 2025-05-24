export type TaskId = string;
export type ColumnId = string;

export interface Comment {
  id: string;
  userId: string; // For simplicity, username directly. In a real app, this would be a user ID.
  userName: string; 
  avatarUrl?: string;
  content: string;
  createdAt: string; // ISO string date
}

export interface Task {
  id: TaskId;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'NONE';
  columnId: ColumnId;
  order: number; // Order within the column
  assigneeUids?: string[]; // User IDs. For mock, can be names.
  reporterId?: string; // User ID. For mock, can be a name.
  dueDate?: string; // YYYY-MM-DD
  tags?: string[];
  comments?: Comment[];
  dependentTaskTitles?: string[]; // For AI priority suggestion
  createdAt: string; // ISO string date
  updatedAt: string; // ISO string date
}

export interface Column {
  id: ColumnId;
  title: string;
  taskIds: TaskId[];
  order: number; // Order of the column on the board
}

export interface Board {
  id: string;
  name: string;
  columns: Column[];
  tasks: Task[];
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl?: string;
}

// For AI Priority Suggestion
export interface AIPrioritySuggestion {
  suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning: string;
}

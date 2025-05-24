
export type UserId = string;
export type ProjectId = string;
export type TeamId = string;
export type TaskId = string;
export type ColumnId = string;

export interface UserProfile {
  id: UserId;
  name: string;
  avatarUrl?: string;
  teamIds?: TeamId[]; // User can be part of multiple teams
}

export interface Team {
  id: TeamId;
  name: string;
  description?: string;
  memberUids: UserId[];
  adminUids?: UserId[];
  projectIds?: ProjectId[]; // Projects associated with this team
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface Project {
  id: ProjectId;
  name: string;
  description?: string;
  teamId?: TeamId; // A project can belong to a team
  ownerId: UserId; // User who created the project
  columns: Column[]; // Columns are now part of a project
  tasks: Task[]; // Tasks are now part of a project
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface Task {
  id: TaskId;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'NONE';
  projectId: ProjectId; 
  columnId: ColumnId; 
  order: number; // Order within the column
  assigneeUids?: UserId[]; 
  reporterId?: UserId; 
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
  taskIds: TaskId[]; // Task IDs currently in this column for this project
  order: number; // Order of the column within the project's board
}

export interface Comment {
  id: string;
  userId: UserId;
  userName: string; 
  avatarUrl?: string;
  content: string;
  createdAt: string; // ISO string date
}

export interface AIPrioritySuggestion {
  suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning: string;
}


export type UserId = string; // Can now be Firebase UID
export type ProjectId = string;
export type TaskId = string;
export type ColumnId = string;

export type UserProjectRole = 'manager' | 'member';

export interface UserProfile {
  id: UserId; // Firebase UID or mock ID
  name: string; // Firebase displayName or mock name
  email?: string; // Firebase email
  avatarUrl?: string; // Firebase photoURL or mock avatar
  role: 'admin' | 'staff'; // Global role for the user in the system
  title?: string; // New field for user title/position
  createdAt?: string; // ISO string, from Firestore
}

export interface Project {
  id: ProjectId;
  name:string;
  description?: string;
  ownerId: UserId; // User who created the project
  columns: Column[]; // Stored with the project
  tasks: Task[];     // Stored with the project
  memberIds?: UserId[]; // Users who are members of this project
  memberRoles?: { [key: UserId]: UserProjectRole }; // Project-specific roles for members
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface NewProjectData {
  name: string;
  description?: string;
}


export interface Task {
  id: TaskId;
  title: string;
  description?: string | null; // Allow null for Firestore
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'NONE';
  projectId: ProjectId; // Ensures task is tied to a project context
  columnId: ColumnId;
  order: number; // Order within the column
  assigneeUids?: UserId[];
  reporterId?: UserId | null; // Allow null for Firestore
  dueDate?: string | null; // YYYY-MM-DD, allow null for Firestore
  tags?: string[];
  comments?: Comment[];
  dependentTaskTitles?: string[]; // For AI priority suggestion
  createdAt: string; // ISO string date
  updatedAt: string; // ISO string date
}

// Used for creating a task, some fields are auto-generated
export type NewTaskData = Omit<Task, 'id' | 'projectId' | 'columnId' | 'createdAt' | 'updatedAt' | 'comments' | 'order'>;


export interface Column {
  id: ColumnId;
  title: string;
  order: number; // Order of the column within the project's board
}

export interface Comment {
  id: string;
  userId: UserId;
  userName: string; // Denormalized for easy display
  avatarUrl?: string; // Denormalized
  content: string;
  createdAt: string; // ISO string date
}

// Used for creating a comment
export type NewCommentData = Omit<Comment, 'id' | 'createdAt'>;


export interface AIPrioritySuggestion {
  suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning: string;
}

// Firestore specific types
export interface ProjectDocument extends Omit<Project, 'id' | 'tasks' | 'columns'> {
  tasks: Task[];
  columns: Column[];
}

export interface UserDocument extends Omit<UserProfile, 'id'> {
  // id is the document ID in Firestore
}
